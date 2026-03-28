import Link from "next/link";
import { Post } from "@/lib/db";

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all duration-200 group">
      {/* Color accent bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {post.source_url ? "AI Review" : "Blog Post"}
          </span>
          <time className="text-xs text-slate-400">{formatDate(post.created_at)}</time>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors leading-snug">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-600 truncate max-w-[180px] transition-colors"
            >
              ↗ {new URL(post.source_url).hostname}
            </a>
          )}
          <Link
            href={`/posts/${post.slug}`}
            className="ml-auto text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/link"
          >
            Read more
            <svg
              className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
