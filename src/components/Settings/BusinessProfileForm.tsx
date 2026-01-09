import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Save, Plus, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface PaymentMethod {
  type: string;
  details: string;
}

export function BusinessProfileForm() {
  const { profile, isLoading, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    email: "",
    phone: "",
    paymentMethods: [] as PaymentMethod[],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || "",
        address: profile.address || "",
        email: profile.email || "",
        phone: profile.phone || "",
        paymentMethods: profile.paymentMethods || [],
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodChange = (index: number, field: "type" | "details", value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((pm, i) => 
        i === index ? { ...pm, [field]: value } : pm
      ),
    }));
  };

  const addPaymentMethod = () => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, { type: "", details: "" }],
    }));
  };

  const removePaymentMethod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success("Profil bisnis berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan profil bisnis");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Profil Bisnis
        </CardTitle>
        <CardDescription>
          Informasi ini akan muncul di invoice PDF dan header aplikasi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nama Bisnis</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Contoh: Ootophia Brewing Labs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="contoh@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+62 xxx xxxx xxxx"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Alamat lengkap bisnis Anda"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Metode Pembayaran</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPaymentMethod}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
          
          {formData.paymentMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada metode pembayaran. Klik "Tambah" untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.paymentMethods.map((pm, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={pm.type}
                    onChange={(e) => handlePaymentMethodChange(index, "type", e.target.value)}
                    placeholder="Jenis (Bank Transfer, GoPay, dll)"
                    className="w-1/3"
                  />
                  <Input
                    value={pm.details}
                    onChange={(e) => handlePaymentMethodChange(index, "details", e.target.value)}
                    placeholder="Detail (No. Rekening, Nama Akun, dll)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePaymentMethod(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </CardContent>
    </Card>
  );
}
