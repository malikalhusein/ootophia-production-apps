import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Transaction, Product, Lineup } from "@/types";
import { formatCurrency } from "@/lib/calculations";

interface EditConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalTransaction: Transaction | null;
  editedTransaction: Transaction | null;
  products: Product[];
  lineups: Lineup[];
  onConfirm: () => void;
}

const statusMap: Record<string, string> = {
  sale: "Penjualan",
  promo: "Promosi",
  rnd: "RnD",
  bonus: "Bonus",
};

export function EditConfirmationDialog({
  open,
  onOpenChange,
  originalTransaction,
  editedTransaction,
  products,
  lineups,
  onConfirm,
}: EditConfirmationDialogProps) {
  if (!originalTransaction || !editedTransaction) return null;

  const getProductName = (productId?: string) => {
    if (!productId) return "-";
    return products.find(p => p.id === productId)?.name || "-";
  };

  const getLineupName = (lineupId?: string) => {
    if (!lineupId) return "-";
    return lineups.find(l => l.id === lineupId)?.name || "-";
  };

  const changes: { field: string; from: string; to: string }[] = [];

  if (originalTransaction.date !== editedTransaction.date) {
    changes.push({
      field: "Tanggal",
      from: new Date(originalTransaction.date).toLocaleDateString('id-ID'),
      to: new Date(editedTransaction.date).toLocaleDateString('id-ID'),
    });
  }

  if (originalTransaction.status !== editedTransaction.status) {
    changes.push({
      field: "Status",
      from: statusMap[originalTransaction.status] || originalTransaction.status,
      to: statusMap[editedTransaction.status] || editedTransaction.status,
    });
  }

  if (originalTransaction.productId !== editedTransaction.productId) {
    changes.push({
      field: "Produk",
      from: getProductName(originalTransaction.productId),
      to: getProductName(editedTransaction.productId),
    });
  }

  if (originalTransaction.lineupId !== editedTransaction.lineupId) {
    changes.push({
      field: "Lineup",
      from: getLineupName(originalTransaction.lineupId),
      to: getLineupName(editedTransaction.lineupId),
    });
  }

  if (originalTransaction.quantity !== editedTransaction.quantity) {
    changes.push({
      field: "Kuantitas",
      from: String(originalTransaction.quantity),
      to: String(editedTransaction.quantity),
    });
  }

  if (originalTransaction.description !== editedTransaction.description) {
    changes.push({
      field: "Keterangan",
      from: originalTransaction.description || "-",
      to: editedTransaction.description || "-",
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Perubahan</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menyimpan perubahan berikut?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {changes.length > 0 ? (
          <div className="space-y-3 my-4">
            {changes.map((change, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50 border space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{change.field}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-destructive line-through">{change.from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-primary font-medium">{change.to}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground my-4">Tidak ada perubahan yang terdeteksi.</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={changes.length === 0}>
            Simpan Perubahan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
