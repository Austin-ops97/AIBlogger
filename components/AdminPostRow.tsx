"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/db";

interface AdminPostRowProps {
  post: Post;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPostRow({ post }: AdminPostRowProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete post.");
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              post.source_url
                ? "text-purple-600 bg-purple-50"
                : "text-indigo-600 bg-indigo-50"
            }`}
          >
            {post.source_url ? "AI" : "Manual"}
          </span>
          <span className="text-xs text-slate-400">{formatDate(post.created_at)}</span>
        </div>
        <h3 className="font-medium text-slate-900 truncate">{post.title}</h3>
        <p className="text-xs text-slate-400 truncate mt-0.5">/posts/{post.slug}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/posts/${post.slug}`}
          className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          target="_blank"
        >
          View
        </Link>
        <Link
          href={`/admin/edit/${post.id}`}
          className="text-xs text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          className="text-xs text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
