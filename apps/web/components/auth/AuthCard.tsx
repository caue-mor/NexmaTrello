"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

export function AuthCard({
  mode,
}: {
  mode: "login" | "register";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    let mounted = true;

    // Fetch CSRF token on mount (this sets the cookie)
    fetch("/api/csrf", {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setCsrf(data.csrf);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Erro ao carregar");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const endpoint =
    mode === "login" ? "/api/auth/login" : "/api/auth/register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Refetch CSRF token before submission to ensure sync
      const csrfRes = await fetch("/api/csrf", {
        credentials: 'include'
      });
      const csrfData = await csrfRes.json();
      const freshCsrf = csrfData.csrf;

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, csrf: freshCsrf }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(mode === "login" ? "Login realizado!" : "Conta criada com sucesso!");
        window.location.href = "/dashboard";
      } else {
        const errorMsg = data.error || "Erro no formulário";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Erro de conexão";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-neutral-50 to-neutral-100"
    >
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-sm text-neutral-500">
              {mode === "login"
                ? "Entre com suas credenciais"
                : "Cadastre-se para começar"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Nome
                </label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <Input
                id="email"
                placeholder="seu@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <input type="hidden" name="csrf" value={csrf} />

            <Button className="w-full" type="submit" disabled={loading}>
              {loading
                ? "Processando..."
                : mode === "login"
                ? "Entrar"
                : "Cadastrar"}
            </Button>
          </form>

          <div className="text-center text-sm text-neutral-500">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <Link
                  href="/register"
                  className="text-black font-medium hover:underline"
                >
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <Link
                  href="/login"
                  className="text-black font-medium hover:underline"
                >
                  Entre aqui
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}