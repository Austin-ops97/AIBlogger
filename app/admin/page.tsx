import { getAllPosts } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-token";
import Link from "next/link";
import AdminPostRow from "@/components/AdminPostRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAuthUser();
  const posts = await getAllPosts();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, <span className="font-medium text-indigo-600">{user?.username}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/ai-review"
            className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Review
          </Link>
          <Link
            href="/admin/new"
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-2xl font-bold text-slate-900">{posts.length}</div>
          <div className="text-sm text-slate-500 mt-1">Total Posts</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-2xl font-bold text-purple-600">
            {posts.filter((p) => p.source_url).length}
          </div>
          <div className="text-sm text-slate-500 mt-1">AI Reviews</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-2xl font-bold text-indigo-600">
            {posts.filter((p) => !p.source_url).length}
          </div>
          <div className="text-sm text-slate-500 mt-1">Manual Posts</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/new"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Write a Post</h3>
          </div>
          <p className="text-sm text-slate-500">Manually write and publish a new blog post with a rich text editor.</p>
        </Link>

        <Link
          href="/admin/ai-review"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">AI URL Review</h3>
          </div>
          <p className="text-sm text-slate-500">Paste any URL and let Claude automatically generate a full blog review.</p>
        </Link>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">All Posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No posts yet. Create your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <AdminPostRow key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
