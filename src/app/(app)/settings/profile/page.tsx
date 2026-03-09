import { PageHeader } from '@/components/PageHeader';
import { User, Mail, Phone, Building2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

/**
 * Profile Page - User account management
 */

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon Profil"
        subtitle="Gérer ton compte et tes informations"
        icon={User}
      />

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          {/* Avatar */}
          <div className="flex items-center justify-center size-20 rounded-2xl bg-secondary/10 text-secondary">
            <User className="size-10" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold">Nico</h2>
            <p className="text-muted-foreground">Chef de cuisine</p>
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-muted-foreground">Prénom</label>
              <Input defaultValue="Nico" />
            </div>
            <div className="space-y-2">
              <label className="text-label text-muted-foreground">Nom</label>
              <Input defaultValue="" placeholder="Ton nom" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label text-muted-foreground flex items-center gap-2">
              <Mail className="size-4" />
              Email
            </label>
            <Input type="email" defaultValue="nico@restaurant.com" />
          </div>

          <div className="space-y-2">
            <label className="text-label text-muted-foreground flex items-center gap-2">
              <Phone className="size-4" />
              Téléphone
            </label>
            <Input type="tel" placeholder="+33 6 00 00 00 00" />
          </div>

          <div className="space-y-2">
            <label className="text-label text-muted-foreground flex items-center gap-2">
              <Building2 className="size-4" />
              Restaurant
            </label>
            <Input defaultValue="Mon Restaurant" disabled className="bg-muted" />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              Sauvegarder
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
