'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, RefreshCw, Pencil, Trash2, Eye, EyeOff,
  Star, ChevronLeft, ChevronRight, X, Check, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
  read_time: string;
  image?: string;
}

interface PostForm {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string;
  image: string;
  meta_description: string;
  read_time: string;
  featured: boolean;
  published: boolean;
  publish_date: string;
}

const emptyForm: PostForm = {
  slug: '', title: '', excerpt: '', content: '',
  author: 'Akaal Psychiatry', category: 'Mental Health',
  tags: '', image: '', meta_description: '',
  read_time: '5 min read', featured: false, published: false,
  publish_date: '',
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const LIMIT = 20;

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog?page=${p}&limit=${LIMIT}`);
      const data = await res.json() as { posts?: BlogPost[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  };

  const openEdit = async (post: BlogPost) => {
    setEditId(post.id);
    const res = await fetch(`/api/blog/${post.id}`);
    const data = await res.json() as { post?: Record<string, unknown> };
    const p = data.post || {};
    setForm({
      slug: String(p.slug || ''),
      title: String(p.title || ''),
      excerpt: String(p.excerpt || ''),
      content: String(p.content || ''),
      author: String(p.author || 'Akaal Psychiatry'),
      category: String(p.category || 'Mental Health'),
      tags: Array.isArray(p.tags) ? (p.tags as string[]).join(', ') : '',
      image: String(p.image || ''),
      meta_description: String(p.meta_description || ''),
      read_time: String(p.read_time || '5 min read'),
      featured: Boolean(p.featured),
      published: Boolean(p.published),
      publish_date: p.publish_date ? String(p.publish_date).slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      publish_date: form.publish_date || null,
    };

    try {
      const url = editId ? `/api/blog/${editId}` : '/api/blog';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSuccess(editId ? 'Post updated successfully.' : 'Post created successfully.');
      setShowForm(false);
      fetchData(page);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDeleteConfirm(null);
      fetchData(page);
    } catch (err) {
      setError(String(err));
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const res = await fetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) fetchData(page);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Blog</h1>
            {total > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                {total} posts
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Manage website blog posts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(page)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && !error && posts.length === 0 && !showForm && (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No blog posts yet.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium"
          >
            Create first post
          </button>
        </div>
      )}

      {/* Post list */}
      {!loading && posts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      post.published ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-muted text-muted-foreground'
                    )}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    {post.featured && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{post.category}</span>
                  </div>
                  <p className="font-medium text-foreground mt-1 truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.author} · {post.read_time} · {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(post)}
                    title={post.published ? 'Unpublish' : 'Publish'}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    {post.published
                      ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                      : <Eye className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(post.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-foreground px-2">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Delete post?</p>
                  <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit form drawer */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="bg-background border-l border-border w-full max-w-2xl h-full overflow-y-auto"
            >
              <form onSubmit={handleSave} className="h-full flex flex-col">
                {/* Form header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
                  <h2 className="text-lg font-semibold text-foreground">
                    {editId ? 'Edit Post' : 'New Post'}
                  </h2>
                  <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="flex-1 px-6 py-6 space-y-5">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Title *</label>
                    <input
                      required type="text" value={form.title}
                      onChange={e => setForm(f => ({
                        ...f, title: e.target.value,
                        slug: f.slug || slugify(e.target.value)
                      }))}
                      placeholder="Post title"
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Slug *</label>
                    <input
                      required type="text" value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                      placeholder="url-friendly-slug"
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Excerpt</label>
                    <textarea
                      rows={2} value={form.excerpt}
                      onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                      placeholder="Short description shown in listings..."
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Content (HTML)</label>
                    <textarea
                      rows={12} value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="<p>Post content in HTML...</p>"
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y font-mono leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Author</label>
                      <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Category</label>
                      <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        placeholder="Mental Health"
                        className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Read Time</label>
                      <input type="text" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))}
                        placeholder="5 min read"
                        className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Publish Date</label>
                      <input type="date" value={form.publish_date} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
                    <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="anxiety, depression, medication management"
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Image URL</label>
                    <input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Meta Description</label>
                    <textarea rows={2} value={form.meta_description}
                      onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                      placeholder="SEO meta description (150-160 chars)..."
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.published}
                        onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.featured}
                        onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Featured</span>
                    </label>
                  </div>
                </div>

                {/* Form footer */}
                <div className="px-6 py-4 border-t border-border sticky bottom-0 bg-background flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Check className="w-4 h-4" /> {editId ? 'Update Post' : 'Create Post'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
