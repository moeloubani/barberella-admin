'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import {
  Settings,
  Store,
  Users,
  Clock,
  Plus,
  Edit,
  Trash,
  Save,
  Loader2,
} from 'lucide-react';
import axios from 'axios';

export default function SettingsPage() {
  const [shopForm, setShopForm] = useState({
    shop_name: '',
    opening_time: '',
    closing_time: '',
    slot_duration: 30,
    days_open: [] as string[],
    max_advance_days: 30,
  });

  const [barberForm, setBarberForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
  });

  const [isBarberDialogOpen, setIsBarberDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await axios.get('/api/settings');
      return response.data;
    },
  });

  // Fetch barbers
  const { data: barbers = [], refetch: refetchBarbers } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const response = await axios.get('/api/barbers');
      return response.data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  // Create barber mutation
  const createBarberMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/barbers', data);
      return response.data;
    },
    onSuccess: () => {
      refetchBarbers();
      toast({
        title: 'Success',
        description: 'Barber added successfully',
      });
      setIsBarberDialogOpen(false);
      setBarberForm({
        name: '',
        email: '',
        phone: '',
        specialties: [],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add barber',
        variant: 'destructive',
      });
    },
  });

  // Update barber mutation
  const updateBarberMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put('/api/barbers', data);
      return response.data;
    },
    onSuccess: () => {
      refetchBarbers();
      toast({
        title: 'Success',
        description: 'Barber updated successfully',
      });
      setIsBarberDialogOpen(false);
      setEditingBarber(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update barber',
        variant: 'destructive',
      });
    },
  });

  // Delete barber mutation
  const deleteBarberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/barbers?id=${id}`);
      return response.data;
    },
    onSuccess: () => {
      refetchBarbers();
      toast({
        title: 'Success',
        description: 'Barber removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove barber',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setShopForm({
        shop_name: settingsData.settings.shop_name || '',
        opening_time: settingsData.settings.opening_time || '',
        closing_time: settingsData.settings.closing_time || '',
        slot_duration: settingsData.settings.slot_duration || 30,
        days_open: settingsData.settings.days_open || [],
        max_advance_days: settingsData.settings.max_advance_days || 30,
      });
    }
  }, [settingsData]);

  const handleSaveShopSettings = async () => {
    await updateSettingsMutation.mutateAsync(shopForm);
  };

  const handleDayToggle = (day: string) => {
    setShopForm((prev) => ({
      ...prev,
      days_open: prev.days_open.includes(day)
        ? prev.days_open.filter((d) => d !== day)
        : [...prev.days_open, day],
    }));
  };

  const handleEditBarber = (barber: any) => {
    setEditingBarber(barber);
    setBarberForm({
      name: barber.name,
      email: barber.email,
      phone: barber.phone,
      specialties: barber.specialties || [],
    });
    setIsBarberDialogOpen(true);
  };

  const handleSaveBarber = async () => {
    if (editingBarber) {
      await updateBarberMutation.mutateAsync({
        id: editingBarber.id,
        ...barberForm,
      });
    } else {
      await createBarberMutation.mutateAsync(barberForm);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    if (confirm('Are you sure you want to remove this barber?')) {
      await deleteBarberMutation.mutateAsync(id);
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your shop settings and barber staff
        </p>
      </div>

      <Tabs defaultValue="shop" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shop">
            <Store className="h-4 w-4 mr-2" />
            Shop Settings
          </TabsTrigger>
          <TabsTrigger value="barbers">
            <Users className="h-4 w-4 mr-2" />
            Barbers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium mb-4">General Settings</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop_name">Shop Name</Label>
                <Input
                  id="shop_name"
                  value={shopForm.shop_name}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, shop_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot_duration">
                  Appointment Slot Duration (minutes)
                </Label>
                <Input
                  id="slot_duration"
                  type="number"
                  value={shopForm.slot_duration}
                  onChange={(e) =>
                    setShopForm({
                      ...shopForm,
                      slot_duration: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium mb-4">
              <Clock className="h-4 w-4 inline mr-2" />
              Operating Hours
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opening_time">Opening Time</Label>
                <Input
                  id="opening_time"
                  type="time"
                  value={shopForm.opening_time}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, opening_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing_time">Closing Time</Label>
                <Input
                  id="closing_time"
                  type="time"
                  value={shopForm.closing_time}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, closing_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-6">
              <Label>Days Open</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day}
                    variant={
                      shopForm.days_open.includes(day) ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleDayToggle(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="max_advance_days">
                Maximum Advance Booking (days)
              </Label>
              <Input
                id="max_advance_days"
                type="number"
                value={shopForm.max_advance_days}
                onChange={(e) =>
                  setShopForm({
                    ...shopForm,
                    max_advance_days: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveShopSettings}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="barbers" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingBarber(null);
                setBarberForm({
                  name: '',
                  email: '',
                  phone: '',
                  specialties: [],
                });
                setIsBarberDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Barber
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barbers.map((barber: any) => (
                  <TableRow key={barber.id}>
                    <TableCell className="font-medium">{barber.name}</TableCell>
                    <TableCell>{barber.email}</TableCell>
                    <TableCell>{barber.phone}</TableCell>
                    <TableCell>
                      {barber.specialties?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {barber.specialties.map((specialty: string) => (
                            <Badge key={specialty} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={barber.is_active ? 'default' : 'secondary'}
                      >
                        {barber.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{barber.stats?.totalAppointments || 0} appts</div>
                        <div className="text-muted-foreground">
                          ${barber.stats?.totalRevenue || 0} revenue
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBarber(barber)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBarber(barber.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Barber Dialog */}
      <Dialog open={isBarberDialogOpen} onOpenChange={setIsBarberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBarber ? 'Edit Barber' : 'Add New Barber'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barber-name">Name</Label>
              <Input
                id="barber-name"
                value={barberForm.name}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barber-email">Email</Label>
              <Input
                id="barber-email"
                type="email"
                value={barberForm.email}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barber-phone">Phone</Label>
              <Input
                id="barber-phone"
                value={barberForm.phone}
                onChange={(e) =>
                  setBarberForm({ ...barberForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barber-specialties">
                Specialties (comma separated)
              </Label>
              <Input
                id="barber-specialties"
                value={barberForm.specialties.join(', ')}
                onChange={(e) =>
                  setBarberForm({
                    ...barberForm,
                    specialties: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g., Haircut, Beard Trim, Hair Coloring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBarberDialogOpen(false);
                setEditingBarber(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBarber}
              disabled={
                createBarberMutation.isPending || updateBarberMutation.isPending
              }
            >
              {(createBarberMutation.isPending ||
                updateBarberMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingBarber ? 'Update' : 'Add'} Barber
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}