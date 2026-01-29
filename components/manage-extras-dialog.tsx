"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Settings, Euro } from "lucide-react"
import { useTraining } from "@/context/training-context"
import { cn } from "@/lib/utils"

interface ManageExtrasDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ManageExtrasDialog({ open, onOpenChange }: ManageExtrasDialogProps) {
    const { adjustments, addAdjustment, deleteAdjustment, taxRetentionRate, setTaxRetentionRate } = useTraining()

    // New adjustment state
    const [description, setDescription] = useState("")
    const [value, setValue] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const handleAdd = () => {
        if (!description || !value) return

        addAdjustment({
            id: crypto.randomUUID(),
            description,
            value: parseFloat(value),
            date: new Date(date)
        })

        // Reset form
        setDescription("")
        setValue("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Extras & Ajustes Financeiros</DialogTitle>
                    <DialogDescription>
                        Adicione valores extra (bónus, deslocações) ou ajustes negativos.
                        Configure também a retenção na fonte.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Tax Settings */}
                    <div className="bg-secondary/20 p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Settings className="w-4 h-4" />
                            <h3>Configuração IRS (Retenção na Fonte)</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label htmlFor="tax-rate" className="text-xs text-muted-foreground">Taxa de Retenção (%)</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="tax-rate"
                                        type="number"
                                        value={taxRetentionRate}
                                        onChange={(e) => setTaxRetentionRate(parseFloat(e.target.value))}
                                        className="pl-8 bg-background"
                                    />
                                    <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                                </div>
                            </div>
                            <div className="flex-[2] text-xs text-muted-foreground p-2">
                                Esta taxa será aplicada a todos os cálculos para mostrar o valor líquido real.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Lista de Ajustes</h3>
                        </div>

                        {/* Add New Form */}
                        <div className="grid grid-cols-12 gap-2 items-end bg-secondary/10 p-2 rounded-md">
                            <div className="col-span-5 space-y-1">
                                <Label className="text-[10px]">Descrição</Label>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Ex: Prémio, Gasolina..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="col-span-3 space-y-1">
                                <Label className="text-[10px]">Valor (€)</Label>
                                <Input
                                    className="h-8 text-xs"
                                    type="number"
                                    placeholder="0.00"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                            </div>
                            <div className="col-span-3 space-y-1">
                                <Label className="text-[10px]">Data</Label>
                                <Input
                                    className="h-8 text-xs px-1"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Button size="icon" className="h-8 w-8" onClick={handleAdd}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {adjustments.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">Nenhum ajuste registado.</p>
                            )}
                            {adjustments.map(adj => (
                                <div key={adj.id} className="flex items-center justify-between p-2 bg-card border border-border rounded text-sm group hover:bg-secondary/20 transition-colors">
                                    <div className="flex gap-2 items-center min-w-0">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            adj.value >= 0 ? "bg-emerald-500" : "bg-rose-500"
                                        )} />
                                        <div className="truncate">
                                            <p className="font-medium truncate">{adj.description}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(adj.date).toLocaleDateString('pt-PT')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "font-mono font-medium",
                                            adj.value >= 0 ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {adj.value > 0 ? "+" : ""}{adj.value}€
                                        </span>
                                        <button
                                            onClick={() => deleteAdjustment(adj.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Concluir</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
