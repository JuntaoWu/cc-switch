import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { proxyApi } from "@/lib/api/proxy";
import { useProxyStack } from "@/lib/query/proxy";
import type { ProxyStack } from "@/types/proxy";
import { extractErrorMessage } from "@/utils/errorUtils";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = ["haiku", "sonnet", "opus", "fable"] as const;
const FOLLOW_DEFAULT = "__follow_default__";

interface RoleOverridesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Each role is saved separately; no four-role draft or full-map replacement. */
export function RoleOverridesSheet({
  open,
  onOpenChange,
}: RoleOverridesSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: stack } = useProxyStack("claude", open);
  const [saving, setSaving] = useState<string | null>(null);

  const updateRole = async (role: string, selected: string) => {
    const modelId = selected === FOLLOW_DEFAULT ? null : selected;
    setSaving(role);
    try {
      await proxyApi.setProxyStackRoleOverride(role, modelId);
      // Refresh errors must never enable the next edit to erase another role.
      // The backend updates only this role; mirror its successful result here.
      queryClient.setQueryData<ProxyStack>(
        ["providers", "claude", "stack"],
        (previous) => {
          if (!previous) return previous;
          const roleOverrides = { ...previous.roleOverrides };
          if (modelId) roleOverrides[role] = modelId;
          else delete roleOverrides[role];
          return { ...previous, roleOverrides };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: ["providers", "claude", "stack"],
      });
    } catch (error) {
      toast.error(
        t("mode.roleOverrides.saveFailed", {
          error: extractErrorMessage(error),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: ["providers", "claude", "stack"],
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent width={420} closeLabel={t("common.close")}>
        <SheetHeader>
          <SheetTitle>{t("mode.roleOverrides.title")}</SheetTitle>
          <SheetDescription>
            {t("mode.roleOverrides.description")}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {ROLES.map((role) => {
            const selected = stack?.roleOverrides?.[role] ?? FOLLOW_DEFAULT;
            const published = (stack?.roleChoices ?? []).some(
              (choice) => choice.id === selected,
            );
            const unavailable = selected !== FOLLOW_DEFAULT && !published;
            const label = role.charAt(0).toUpperCase() + role.slice(1);
            return (
              <div key={role} className="space-y-1.5">
                <label className="text-caption font-semibold text-fg-2">
                  {label}
                </label>
                <Select
                  value={selected}
                  onValueChange={(id) => void updateRole(role, id)}
                  disabled={!stack || saving !== null}
                >
                  <SelectTrigger aria-label={label} className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[70]">
                    <SelectItem value={FOLLOW_DEFAULT}>
                      {t("mode.roleOverrides.followDefault")}
                    </SelectItem>
                    {(stack?.roleChoices ?? []).map((choice) => (
                      <SelectItem key={choice.id} value={choice.id}>
                        {choice.displayName}
                      </SelectItem>
                    ))}
                    {unavailable && (
                      <SelectItem value={selected}>
                        {selected} ({t("mode.roleOverrides.unavailable")})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {unavailable && (
                  <p className="text-caption text-warning-text">
                    {t("mode.roleOverrides.unavailableHint")}
                  </p>
                )}
              </div>
            );
          })}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
