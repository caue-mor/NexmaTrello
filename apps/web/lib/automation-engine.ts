import { prisma } from "@/lib/db";

export type TriggerType = "CARD_MOVED" | "CARD_CREATED";
export type ActionType = "MOVE_CARD" | "ADD_LABEL" | "MARK_COMPLETE";

export class AutomationEngine {
    static async trigger(boardId: string, type: TriggerType, context: any) {
        try {
            const automations = await prisma.automation.findMany({
                where: {
                    boardId,
                    triggerType: type,
                    isActive: true,
                },
            });

            console.log(`[Automation] Found ${automations.length} automations for ${type} on board ${boardId}`);

            for (const auto of automations) {
                if (this.checkCondition(auto.triggerConfig, context)) {
                    console.log(`[Automation] Executing automation: ${auto.name}`);
                    await this.executeAction(auto.actionType as ActionType, auto.actionConfig, context);
                }
            }
        } catch (error) {
            console.error("[Automation] Error processing trigger:", error);
        }
    }

    private static checkCondition(config: any, context: any): boolean {
        // CARD_MOVED: Check if moved from/to specific columns
        if (context.fromColumnId && config.fromColumnId) {
            if (context.fromColumnId !== config.fromColumnId) return false;
        }
        if (context.toColumnId && config.toColumnId) {
            if (context.toColumnId !== config.toColumnId) return false;
        }

        return true;
    }

    private static async executeAction(type: ActionType, config: any, context: any) {
        const { cardId } = context;
        if (!cardId) return;

        switch (type) {
            case "MOVE_CARD":
                if (config.targetColumnId) {
                    await prisma.card.update({
                        where: { id: cardId },
                        data: { columnId: config.targetColumnId },
                    });
                    // Create activity log
                    await prisma.activity.create({
                        data: {
                            boardId: context.boardId,
                            cardId: cardId,
                            userId: "system", // Or a specific bot user ID
                            type: "CARD_MOVED",
                            metadata: {
                                fromColumnId: context.toColumnId, // It was already moved, but we move it again? 
                                // Actually, if the action is move card, it implies moving it to ANOTHER column
                                toColumnId: config.targetColumnId,
                                automated: true,
                            },
                        },
                    });
                }
                break;

            case "MARK_COMPLETE":
                await prisma.card.update({
                    where: { id: cardId },
                    data: {
                        completedAt: new Date(),
                        columnId: config.targetColumnId || undefined // Optional move
                    },
                });
                break;

            case "ADD_LABEL":
                if (config.labelId) {
                    await prisma.cardLabel.create({
                        data: {
                            cardId,
                            labelId: config.labelId,
                        },
                    }).catch(() => { }); // Ignore if already exists
                }
                break;
        }
    }
}
