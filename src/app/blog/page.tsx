/**
 * /admin/blog
 */
import { AdminBlogPage } from './AdminBlogPage';
export const metadata = { title: 'Blog | Admin', robots: { index: false, follow: false } };
export default function Page() { return <AdminBlogPage />; }
