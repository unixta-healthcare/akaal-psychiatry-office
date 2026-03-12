/**
 * /admin/inquiries — Contact form submissions
 */
import { AdminInquiriesPage } from './AdminInquiriesPage';

export const metadata = {
  title: 'Inquiries | Admin',
  robots: { index: false, follow: false },
};

export default function InquiriesPage() {
  return <AdminInquiriesPage />;
}
