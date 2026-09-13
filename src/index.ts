import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { db } from './db';
import { bookings } from './db/schema';

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .use(html())
  .get('/', async () => {
    const file = Bun.file('public/index.html');
    return new Response(await file.text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
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

        try {
          await db.insert(bookings).values({
            patientName,
            phone,
            serviceName,
            address,
            notes: notes || '',
          });
        } catch (dbErr) {
          console.warn('Database connection warning:', dbErr);
        }

        return {
          success: true,
          message: 'Booking berhasil diterima!',
          data: { patientName, phone, serviceName, address },
        };
      } catch (err: any) {
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
  .listen({ hostname: '0.0.0.0', port });

console.log(`🦊 Elysia is running at http://localhost:${port}`);
