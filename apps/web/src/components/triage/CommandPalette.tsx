import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  MapPin,
  Truck,
  Calendar,
  AlertTriangle,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  Radio,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Live Operations', path: '/live', icon: Radio },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'TPS', path: '/tps', icon: MapPin },
  { label: 'Armada', path: '/fleet', icon: Truck },
  { label: 'Jadwal', path: '/schedules', icon: Calendar },
  { label: 'Pengaduan', path: '/complaints', icon: AlertTriangle },
  { label: 'Pembayaran', path: '/payments', icon: CreditCard },
  { label: 'Pengguna', path: '/users', icon: Users },
  { label: 'Laporan', path: '/reports', icon: FileText },
];

const QUICK_ACTIONS = [
  { label: 'Triage pengaduan baru', path: '/complaints?status=submitted', icon: AlertTriangle },
  { label: 'Pengaduan SLA kritis', path: '/complaints?status=submitted,verified', icon: AlertTriangle },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const runCommand = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Ketik perintah atau cari..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil.</CommandEmpty>

        <CommandGroup heading="Aksi Cepat">
          {QUICK_ACTIONS.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigasi">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Lainnya">
          <CommandItem onSelect={() => runCommand(logout)}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
