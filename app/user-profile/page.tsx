"use client";

import Header from '@/components/Header';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/Firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  role: string;
  photoURL: string;
  createdAt?: unknown;
}

export default function UserProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    role: "",
    photoURL: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

    

  const fetchProfile = async (user: User) => {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const filled = {
        displayName: data.displayName || user.displayName || "",
        email: data.email || user.email || "",
        bio: data.bio || "",
        location: data.location || "",
        website: data.website || "",
        role: data.role || "",
        photoURL: data.photoURL || user.photoURL || "",
      };
      setProfile({ uid: user.uid, ...filled });
      setForm(filled);
      setImagePreview(filled.photoURL);
    } else {
      const filled = {
        displayName: user.displayName || "",
        email: user.email || "",
        bio: "",
        location: "",
        website: "",
        role: "",
        photoURL: user.photoURL || "",
      };
      setForm(filled);
      setImagePreview(filled.photoURL);
    }
  };


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      await fetchProfile(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !currentUser) return form.photoURL;
    setUploading(true);
    const storageRef = ref(storage, `avatars/${currentUser.uid}`);
    await uploadBytes(storageRef, imageFile);
    const url = await getDownloadURL(storageRef);
    setUploading(false);
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError("");
    setSaving(true);
    try {
      const photoURL = await uploadImage();
      const payload = { uid: currentUser.uid, ...form, photoURL, createdAt: serverTimestamp() };
      await setDoc(doc(db, "users", currentUser.uid), payload, { merge: true });
      setProfile({ ...payload });
      setForm((prev) => ({ ...prev, photoURL }));
      setImagePreview(photoURL);
      toast.success("Profile updated successfully!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch(error) {
      setError("Failed to save. Please try again.");
    //   console.log(error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* Header */}
      <Header />

      {/* Header ends here */}

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── LEFT: Current User Profile Display ─────────────── */}
          <section>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-white">My Profile</h1>
              <p className="text-zinc-500 text-sm mt-1">Your public profile as others see it</p>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-[#0d0d15] overflow-hidden">
              {/* Banner */}
              <div className="h-28 bg-gradient-to-br from-violet-900/60 via-fuchsia-900/30 to-[#0d0d15] relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(124,58,237,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(192,38,211,0.3) 0%, transparent 50%)`,
                  }}
                />
                {/* Edit shortcut button */}
                {/* <Link
                  href={currentUser ? `/edit-user/${currentUser.uid}` : "#"}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 hover:bg-black/60 transition-all backdrop-blur-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit profile
                </Link> */}
              </div>

              <div className="px-6 pb-6 -mt-10 relative">
                {/* Avatar */}
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    className="w-20 h-20 rounded-2xl object-cover border-[3px] border-[#0d0d15] ring-2 ring-violet-500/30"
                    width={80}
                    height={80}
                    loading="eager"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 flex items-center justify-center text-2xl font-bold text-white border-[3px] border-[#0d0d15] ring-2 ring-violet-500/30">
                    {getInitials(form.displayName || "U")}
                  </div>
                )}

                {/* Name & role */}
                <div className="mt-3 mb-5">
                  <h2 className="text-lg font-semibold text-white">
                    {form.displayName || <span className="text-zinc-500 italic">No name set</span>}
                  </h2>
                  {form.role && (
                    <p className="text-sm text-violet-300 mt-0.5">{form.role}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">{form.email}</p>
                </div>

                {/* Bio */}
                {form.bio ? (
                  <p className="text-sm text-zinc-400 leading-relaxed mb-5 border-l-2 border-violet-500/30 pl-3">
                    {form.bio}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600 italic mb-5">No bio yet — add one in the form →</p>
                )}

                {/* Info chips */}
                <div className="flex flex-wrap gap-2">
                  {form.location && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs text-zinc-400">
                      <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {form.location}
                    </span>
                  )}
                  {form.website && (
                    <a
                      href={form.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Website
                    </a>
                  )}
                </div>

                {/* Empty state chips hint */}
                {!form.location && !form.website && (
                  <p className="text-xs text-zinc-600 italic">Location and website will appear here once saved.</p>
                )}

                {/* Divider + edit CTA */}
                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-zinc-600">Profile last updated via form</span>
                  {/* <Link
                    href={currentUser ? `/edit-user/${currentUser.uid}` : "#"}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Go to full edit page
                  </Link> */}
                </div>
              </div>
            </div>
          </section>

          {/* ── RIGHT: Inline Quick-Edit Form ───────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Quick Edit</h2>
              <p className="text-zinc-500 text-sm mt-1">Update your info — changes reflect live on the left</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0d0d15] overflow-hidden">
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <div className="relative group flex-shrink-0">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/10" width={64} height={64} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 flex items-center justify-center text-lg font-bold text-white border-2 border-white/10">
                        {getInitials(form.displayName || "U")}
                      </div>
                    )}
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {uploading && (
                      <div className="absolute inset-0 rounded-2xl bg-black/70 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Profile photo</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Hover avatar and click to upload via Firebase</p>
                    {imageFile && (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Display Name */}
                <Field label="Display Name" badge="pre-filled"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
                  <input type="text" value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Your full name"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all" />
                </Field>

                {/* Email — read-only, pre-filled from auth */}
                <Field label="Email" badge="pre-filled"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
                  <input type="email" value={form.email} readOnly
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed" />
                </Field>

                {/* Bio */}
                <Field label="Bio"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                  <textarea value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell the world about yourself…" rows={3}
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all resize-none" />
                </Field>

                {/* Location */}
                <Field label="Location"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
                  <input type="text" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all" />
                </Field>

                {/* Website */}
                <Field label="Website"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}>
                  <input type="url" value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://yoursite.com"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all" />
                </Field>

                {/* Role */}
                <Field label="Role / Title"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
                  <input type="text" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Designer, Engineer…"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all" />
                </Field>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={saving || uploading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  ) : saveSuccess ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved!</>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────── */
function Field({
  label, icon, badge, children,
}: {
  label: string; icon: React.ReactNode; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500">{icon}</span>
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        {badge && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}