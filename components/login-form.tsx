"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTraining } from "@/context/training-context"
import { Lock } from "lucide-react"

export function LoginForm() {
    const { login } = useTraining()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (login(username, password)) {
            setError(false)
        } else {
            setError(true)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Calendário Ivo</CardTitle>
                    <CardDescription className="text-center">
                        Insira as suas credenciais para aceder
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="username">Utilizador</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="ivogarcia"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">
                                Dados incorretos. Tente novamente.
                            </p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit">
                            Entrar
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
