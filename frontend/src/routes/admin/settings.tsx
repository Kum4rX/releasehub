import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/layout/admin-guard";
import { PageHeader } from "@/components/common/states";
import { AuthorAvatar } from "@/components/changelog/author-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { currentAdmin } from "@/data/mock";
import { useReleaseStore } from "@/store/release-store";
import { useTheme, type ThemeMode } from "@/store/theme";
import { getUserProfile, updateUserProfile } from "@/services/userService";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ReleaseHub admin" },
      { name: "description", content: "Manage your ReleaseHub profile, appearance and notifications." },
      { property: "og:title", content: "Settings — ReleaseHub admin" },
      {
        property: "og:description",
        content: "Manage your ReleaseHub profile, appearance and notifications.",
      },
    ],
  }),
  component: SettingsPage,
});

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[16rem_1fr]">
      <div className="space-y-1">
        <h2 className="text-h3">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="panel space-y-5 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { session, signOut } = useReleaseStore();
  const { mode, setMode } = useTheme();
  const user = session?.user ?? currentAdmin;

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [email, setEmail] = useState("aria@releasehub.dev");
  const [bio, setBio] = useState(
    "Product lead at ReleaseHub. I write most of the changelog entries you see here.",
  );
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [prefs, setPrefs] = useState({
    productUpdates: true,
    weeklyDigest: false,
    releaseNotifications: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getUserProfile();
        if (mounted && profile) {
          setName(profile.name);
          setEmail(profile.email);
          setRole(profile.role === "admin" ? "Administrator" : "Member");
        }
      } catch {
        // Fallback to session user if profile fetch fails
        if (mounted && session?.user) {
          setName(session.user.name);
          setRole(session.user.role);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUserProfile({ name: name.trim() });
      setName(updated.name);
      toast.success("Profile saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Profile, appearance and notification preferences for the demo workspace."
      />

      <div className="mt-8 space-y-10">
        <Section title="Profile" description="How your name appears on published updates.">
          <div className="flex items-center gap-3">
            <AuthorAvatar author={{ ...user, name }} />
            <div className="text-sm">
              <p className="font-medium">{name || "Unnamed"}</p>
              <p className="text-caption text-muted-foreground">{role}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Display name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-role">Role (system managed)</Label>
              <Input id="settings-role" value={role} disabled className="opacity-70 cursor-not-allowed" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-email">Email (system managed)</Label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              disabled
              className="opacity-70 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-bio">Short bio</Label>
            <Textarea
              id="settings-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </Section>

        <Section title="Appearance" description="Choose light, dark, or follow your system.">
          <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
            <div className="space-y-1">
              <Label htmlFor="settings-theme">Theme</Label>
              <p className="text-caption text-muted-foreground">Applies instantly across ReleaseHub.</p>
            </div>
            <Select value={mode} onValueChange={(value) => setMode(value as ThemeMode)}>
              <SelectTrigger id="settings-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title="Notifications" description="What lands in the What's new panel and your inbox.">
          {(
            [
              {
                key: "productUpdates" as const,
                label: "Product updates",
                hint: "Notify me when an update is published.",
              },
              {
                key: "weeklyDigest" as const,
                label: "Weekly digest",
                hint: "A Monday summary of everything shipped.",
              },
              {
                key: "releaseNotifications" as const,
                label: "Release notifications",
                hint: "Alerts for version releases and hotfixes.",
              },
            ]
          ).map((item, index) => (
            <div key={item.key}>
              {index > 0 ? <Separator className="mb-5" /> : null}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor={`pref-${item.key}`}>{item.label}</Label>
                  <p className="text-caption text-muted-foreground">{item.hint}</p>
                </div>
                <Switch
                  id={`pref-${item.key}`}
                  checked={prefs[item.key]}
                  onCheckedChange={(checked) => {
                    setPrefs((prev) => ({ ...prev, [item.key]: checked }));
                    toast.success(`${item.label} ${checked ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Account" description="Session and workspace actions for this demo.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Sign out of the demo</p>
              <p className="text-caption text-muted-foreground">
                Signing out shows the permission state on admin pages.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                signOut();
                toast.success("Signed out");
                navigate({ to: "/login" });
              }}
            >
              Sign out
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-destructive">Delete workspace</p>
              <p className="text-caption text-muted-foreground">
                This is a demo — workspace deletion is disabled.
              </p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete workspace</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this workspace?</DialogTitle>
                  <DialogDescription>
                    In production, this permanently deletes all updates and workspace resources.
                    Workspace deletion is currently disabled.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteOpen(false);
                      toast.info("Deletion cancelled");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteOpen(false);
                      toast.error("Workspace deletion is disabled");
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Section>
      </div>
    </AdminGuard>
  );
}
