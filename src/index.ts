import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { desc, eq } from 'drizzle-orm';
import { db } from './db';
import { bookings } from './db/schema';

const port = Number(process.env.PORT) || 3000;

const serveAdmin = async () => {
  return new Response(await Bun.file('public/admin.html').text(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

const app = new Elysia()
  .use(html())
  .get('/', async () => {
    return new Response(await Bun.file('public/index.html').text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
  .get('/admin', serveAdmin)
  .get('/admin.html', serveAdmin)
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }))
  .get('/api/services', () => [
    {
      category: 'Daftar Infus',
      items: [
        { name: 'Infus Demam', price: 170000 },
        { name: 'Infus Demam + Vitamin', price: 250000 },
        { name: 'Infus Asam Lambung', price: 150000 },
        { name: 'Infus Mual Muntah', price: 160000 },
        { name: 'Infus Asam Lambung + Mual Muntah', price: 170000 },
        { name: 'Infus Vitamin C1000', price: 200000 },
        { name: 'Infus Neurobion', price: 180000 },
        { name: 'Infus Vitamin C1000 + Neurobion', price: 250000 },
        { name: 'Infus Diare / Dehidrasi', price: 160000 },
      ],
    },
    {
      category: 'Daftar Injeksi',
      items: [
        { name: 'Suntik Anti Nyeri', price: 100000 },
        { name: 'Suntik Mual Muntah', price: 85000 },
        { name: 'Suntik Asam Lambung', price: 85000 },
      ],
    },
    {
      category: 'Tindakan Keperawatan',
      items: [
        { name: 'Rawat Luka / Ganti Verban (Modern Dressing)', price: 'Disesuaikan' },
        { name: 'Ganti Selang Cateter', price: 'Steril Medis' },
        { name: 'Ganti Selang NGT', price: 'Steril Medis' },
      ],
    },
    {
      category: 'Cek Skrining Metabolik',
      items: [
        { name: 'Cek Gula Darah', price: 15000 },
        { name: 'Cek Asam Urat', price: 20000 },
        { name: 'Cek Kolesterol', price: 25000 },
      ],
    },
  ])
  .post(
    '/api/bookings',
    async ({ body, set }) => {
      try {
        const { patientName, phone, serviceName, address, notes } = body;

        if (!patientName || !phone || !serviceName || !address) {
          set.status = 400;
          return { success: false, message: 'Mohon lengkapi data pasien' };
        }

        const inserted = await db.insert(bookings).values({
          patientName,
          phone,
          serviceName,
          address,
          notes: notes || '',
          status: 'pending',
        });

        return {
          success: true,
          message: 'Booking berhasil diterima!',
          data: { patientName, phone, serviceName, address },
        };
      } catch (err: any) {
        console.error('Error inserting booking:', err);
        set.status = 500;
        return { success: false, message: err?.message || 'Server error' };
      }
    },
    {
      body: t.Object({
        patientName: t.String(),
        phone: t.String(),
        serviceName: t.String(),
        address: t.String(),
        notes: t.Optional(t.String()),
      }),
    }
  )
  .get('/api/admin/bookings', async ({ set }) => {
    try {
      const data = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
      return { success: true, data };
    } catch (err: any) {
      console.error('Error fetching admin bookings:', err);
      set.status = 500;
      return { success: false, message: err?.message || 'Server error' };
    }
  })
  .patch(
    '/api/admin/bookings/:id/status',
    async ({ params, body, set }) => {
      try {
        const id = Number(params.id);
        const { status } = body;

        if (!id || isNaN(id)) {
          set.status = 400;
          return { success: false, message: 'ID tidak valid' };
        }

        await db.update(bookings).set({ status }).where(eq(bookings.id, id));

        return { success: true, message: 'Status booking berhasil diperbarui' };
      } catch (err: any) {
        console.error('Error updating status:', err);
        set.status = 500;
        return { success: false, message: err?.message || 'Server error' };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.String(),
      }),
    }
  )
  .listen({ hostname: '0.0.0.0', port });

console.log(`🦊 Elysia is running at http://localhost:${port}`);
