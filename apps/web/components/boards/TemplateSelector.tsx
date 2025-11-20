"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Template {
    id: string;
    title: string;
    description: string;
    category: string;
    columns: string[];
}

interface TemplateSelectorProps {
    onClose?: () => void;
}

export function TemplateSelector({ onClose }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [boardTitle, setBoardTitle] = useState("");
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/templates")
            .then((res) => res.json())
            .then((data) => {
                setTemplates(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load templates", err);
                setLoading(false);
            });
    }, []);

    const handleCreate = async () => {
        if (!selectedTemplate || !boardTitle.trim()) return;

        setCreating(true);
        try {
            const res = await fetch("/api/boards/from-template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    title: boardTitle,
                }),
            });

            if (!res.ok) throw new Error("Failed to create board");

            const data = await res.json();
            toast.success("Quadro criado com sucesso!");
            router.push(`/board/${data.boardId}`);
            if (onClose) onClose();
        } catch (error) {
            toast.error("Erro ao criar quadro");
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    const categories = Array.from(new Set(templates.map((t) => t.category)));

    if (loading) {
        return <div className="p-8 text-center">Carregando templates...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="board-title">Nome do Quadro</Label>
                <Input
                    id="board-title"
                    placeholder="Ex: Projeto Website"
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Escolha um Modelo</Label>
                <Tabs defaultValue="Geral" className="w-full">
                    <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start mb-4">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category}
                                value={category}
                                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 border border-transparent data-[state=active]:border-blue-200"
                            >
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categories.map((category) => (
                        <TabsContent key={category} value={category} className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates
                                    .filter((t) => t.category === category)
                                    .map((template) => (
                                        <div
                                            key={template.id}
                                            className={`
                        relative border rounded-xl p-4 cursor-pointer transition-all
                        ${selectedTemplate === template.id
                                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                                    : "border-neutral-200 hover:border-blue-300 hover:bg-neutral-50"
                                                }
                      `}
                                            onClick={() => setSelectedTemplate(template.id)}
                                        >
                                            {selectedTemplate === template.id && (
                                                <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-neutral-100 shadow-sm">
                                                    <Layout className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-900">
                                                        {template.title}
                                                    </h4>
                                                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                                                        {template.description}
                                                    </p>
                                                    <div className="flex gap-1 mt-3 flex-wrap">
                                                        {template.columns.slice(0, 3).map((col, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded"
                                                            >
                                                                {col}
                                                            </span>
                                                        ))}
                                                        {template.columns.length > 3 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                                                                +{template.columns.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleCreate}
                    disabled={!selectedTemplate || !boardTitle.trim() || creating}
                    className="w-full sm:w-auto"
                >
                    {creating ? "Criando..." : "Criar Quadro"}
                </Button>
            </div>
        </div>
    );
}
