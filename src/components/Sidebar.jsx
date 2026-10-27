import { Bot, Calendar, Clock, CreditCard, Globe, LogOut, Mail, Megaphone, MessageCircle, Phone, PhoneCall, Settings, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navSections = [
        {
            label: 'Restaurant',
            items: [
                { path: '/reservations', label: 'Reservations', icon: Calendar },
                // Stats page/route kept; nav item temporarily hidden
                // { path: '/stats', label: 'Stats', icon: BarChart3 },
                { path: '/guests', label: 'Guests', icon: Users },
                { path: '/availability', label: 'Availability', icon: Clock },
            ],
        },
        {
            label: 'Setup',
            items: [
                { path: '/settings', label: 'Settings', icon: Settings },
                { path: '/botsettings', label: 'Bot-Settings', icon: Bot },
                // { path: '/widget', label: 'Widget', icon: Code2 },
                // { path: '/widget-conversations', label: 'Widget Chats', icon: MessageCircle },
                { path: '/payments', label: 'Payments', icon: CreditCard },
                { path: '/set-number', label: 'Restaurant Number', icon: Phone },
            ],
        },
        {
            label: 'Inbox',
            items: [
                { path: '/all-calls', label: 'All Calls', icon: PhoneCall },
                { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
                { path: '/website-widget', label: 'Website Widget', icon: Globe },
                { path: '/email', label: 'Email', icon: Mail },
            ],
        },
        {
            label: 'Marketing',
            items: [
                { path: '/marketing', label: 'Marketing', icon: Megaphone },
            ],
        },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-52 bg-sidebar border-r border-sidebar-border flex flex-col">
            {/* Logo - Updated to point to Reservations */}
            <div className="px-4 py-6 border-b border-sidebar-border">
                <Link to="/reservations" className="text-lg font-heading font-semibold text-sidebar-foreground tracking-tight">
                    Booki
                </Link>
                {/* <p className="text-xs text-sidebar-foreground/50 mt-1">by JarvisCalling</p> */}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {navSections.map((section, index) => (
                    <div key={section.label} className={index > 0 ? 'mt-4 border-t border-gray-200 pt-4' : ''}>
                        <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {section.label}
                        </p>
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${isActive
                                                ? 'bg-primary text-white'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-sm">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="px-3 pb-1">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm">Logout</span>
                </button>
            </div>

            {/* Footer - Removed "Switch Platform" since that page is gone */}
            <div className="px-4 py-3 border-t border-sidebar-border">
                <p className="text-xs text-sidebar-foreground/50">
                    © 2026 Booki.ai
                </p>
            </div>
        </aside>
    );
}

export default Sidebar;
