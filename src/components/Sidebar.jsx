import { Bot, Calendar, Clock, CreditCard, LogOut, Phone, PhoneOff, Settings, Users } from 'lucide-react';
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

    const navItems = [
        { path: '/reservations', label: 'Reservations', icon: Calendar },
        { path: '/other-calls', label: 'Other Calls', icon: PhoneOff },
        // Stats page/route kept; nav item temporarily hidden
        // { path: '/stats', label: 'Stats', icon: BarChart3 },
        { path: '/guests', label: 'Guests', icon: Users },
        { path: '/availability', label: 'Availability', icon: Clock },
        { path: '/settings', label: 'Settings', icon: Settings },
        { path: '/botsettings', label: 'Bot-Settings', icon: Bot },
        // { path: '/widget', label: 'Widget', icon: Code2 },
        // { path: '/widget-conversations', label: 'Widget Chats', icon: MessageCircle },
        { path: '/payments', label: 'Payments', icon: CreditCard },
        { path: '/set-number', label: 'Restaurant Number', icon: Phone },
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
            <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
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
