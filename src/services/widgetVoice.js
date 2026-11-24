import { JARVIS_BASE_URL } from './api/endpoints';

async function postJson(path, body) {
    const response = await fetch(`${JARVIS_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The call could not be saved');
    return data;
}

export async function startWidgetCall({ sessionId, visitorKey, websiteDomain, onState, onLine }) {
    onState('connecting');
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
        throw new Error('Microphone permission was blocked. Allow the microphone and try the call again.');
    });

    const secretResponse = await fetch(`${JARVIS_BASE_URL}/api/widget/session?sessionId=${encodeURIComponent(sessionId)}&visitorKey=${encodeURIComponent(visitorKey)}`);
    const secret = await secretResponse.json();
    if (!secretResponse.ok || !secret.value) throw new Error(secret.error || 'Voice session could not be started');

    const pc = new RTCPeerConnection();
    const audio = new Audio();
    audio.autoplay = true;
    pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        audio.play().catch(() => {});
    };
    mic.getTracks().forEach((track) => pc.addTrack(track, mic));
    const channel = pc.createDataChannel('oai-events');
    const heard = [];
    const greeting = secret.greeting || '';
    let greetingSent = false;
    const callId = crypto.randomUUID();
    const unmute = () => mic.getTracks().forEach((track) => { track.enabled = true; });
    const speakGreeting = () => {
        if (greetingSent || !greeting || channel.readyState !== 'open' || pc.connectionState !== 'connected') return;
        greetingSent = true;
        mic.getTracks().forEach((track) => { track.enabled = false; });
        channel.send(JSON.stringify({
            type: 'response.create',
            response: { instructions: `Say exactly this English sentence and then stop: ${greeting}` },
        }));
        setTimeout(unmute, 12000);
    };
    channel.onopen = speakGreeting;
    const startedAt = new Date().toISOString();

    const save = (extra) => postJson('/api/widget/conversations', {
        sessionId,
        visitorKey,
        websiteDomain,
        ...extra,
    }).catch(() => {});

    save({
        call: { id: callId, status: 'connecting', startedAt },
        appendEvents: [{ id: `call-${callId}-start`, at: startedAt, from: 'system', text: 'Voice call started', kind: 'call', callId }],
    });

    channel.onmessage = async (event) => {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        const at = new Date().toISOString();
        if (message.type === 'conversation.item.input_audio_transcription.completed' && message.transcript) {
            heard.push(message.transcript);
            onLine({ from: 'visitor', text: message.transcript, at, kind: 'voice' });
            save({ appendEvents: [{ id: `v-${callId}-${at}`, at, from: 'visitor', text: message.transcript, kind: 'voice', callId }] });
        }
        if ((message.type === 'response.output_audio_transcript.done' || message.type === 'response.audio_transcript.done') && message.transcript) {
            onLine({ from: 'assistant', text: message.transcript, at, kind: 'voice' });
            if (message.transcript.trim() !== greeting) {
                save({ appendEvents: [{ id: `a-${callId}-${at}`, at, from: 'assistant', text: message.transcript, kind: 'voice', callId }] });
            }
        }
        if (message.type === 'response.done') unmute();
        if (message.type === 'response.function_call_arguments.done') {
            let args = {};
            try { args = JSON.parse(message.arguments || '{}'); } catch { args = {}; }
            const output = await postJson('/api/widget/tool', {
                sessionId,
                visitorKey,
                name: message.name,
                arguments: args,
                heard,
            }).catch(() => ({ error: 'The booking check failed.' }));
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: { type: 'function_call_output', call_id: message.call_id, output: JSON.stringify(output) },
                }));
                channel.send(JSON.stringify({ type: 'response.create' }));
            }
        }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') resolve();
        else {
            const timeout = setTimeout(resolve, 2500);
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete') {
                    clearTimeout(timeout);
                    resolve();
                }
            };
        }
    });

    const answer = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: pc.localDescription.sdp,
        headers: {
            Authorization: `Bearer ${secret.value}`,
            'Content-Type': 'application/sdp',
        },
    });
    if (!answer.ok) {
        mic.getTracks().forEach((track) => track.stop());
        pc.close();
        throw new Error('The voice connection was refused');
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
    onState('active');
    save({ call: { id: callId, status: 'active', startedAt } });
    pc.onconnectionstatechange = speakGreeting;
    if (pc.connectionState === 'connected') speakGreeting();

    return {
        async stop(callStatus = 'completed') {
            const endedAt = new Date().toISOString();
            onState(callStatus);
            await save({
                call: { id: callId, status: callStatus, startedAt, endedAt },
                appendEvents: [{ id: `call-${callId}-end`, at: endedAt, from: 'system', text: `Voice call ${callStatus}`, kind: 'call', callId }],
            });
            channel.close();
            pc.close();
            mic.getTracks().forEach((track) => track.stop());
            audio.srcObject = null;
        },
    };
}
