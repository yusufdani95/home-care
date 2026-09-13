import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';
import { desc, eq } from 'drizzle-orm';
import { db } from './db';
import { bookings, users } from './db/schema';

const port = Number(process.env.PORT) || 3000;
const jwtSecret = process.env.JWT_SECRET || 'home-care-secret-key-2026';

const verifyAuth = async (jwtInstance: any, token?: any) => {
  if (!token || typeof token !== 'string') return null;
  const payload = await jwtInstance.verify(token);
  return payload || null;
};

const app = new Elysia()
  .use(html())
  .use(cookie())
  .use(
    jwt({
      name: 'jwt',
      secret: jwtSecret,
      exp: '7d',
    })
  )
  .use(staticPlugin({ assets: 'public', prefix: '/' }))
  .get('/', async () => {
    return new Response(await Bun.file('public/index.html').text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
  .get('/login', async ({ jwt, cookie, redirect }) => {
    const user = await verifyAuth(jwt, cookie.auth_token?.value);
    if (user) {
      return redirect('/admin');
    }
    return new Response(await Bun.file('public/login.html').text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
  .get('/login.html', async ({ jwt, cookie, redirect }) => {
    const user = await verifyAuth(jwt, cookie.auth_token?.value);
    if (user) {
      return redirect('/admin');
    }
    return new Response(await Bun.file('public/login.html').text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
  .get('/admin', async ({ jwt, cookie, redirect }) => {
    const user = await verifyAuth(jwt, cookie.auth_token?.value);
    if (!user) {
      return redirect('/login');
    }
    return new Response(await Bun.file('public/admin.html').text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
  .get('/admin.html', async ({ jwt, cookie, redirect }) => {
    const user = await verifyAuth(jwt, cookie.auth_token?.value);
    if (!user) {
      return redirect('/login');
    }
    return new Response(await Bun.file('public/admin.html').text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  })
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }))
  .post(
    '/api/auth/login',
    async ({ body, jwt, cookie, set }) => {
      try {
        const { username, password } = body;
        if (!username || !password) {
          set.status = 400;
          return { success: false, message: 'Mohon isi username dan password' };
        }

        const foundUser = await db.select().from(users).where(eq(users.username, username)).then((res) => res[0]);

        if (!foundUser) {
          set.status = 400;
          return { success: false, message: 'Username atau password salah' };
        }

        const isPasswordValid = await Bun.password.verify(password, foundUser.password);
        if (!isPasswordValid) {
          set.status = 400;
          return { success: false, message: 'Username atau password salah' };
        }

        const token = await jwt.sign({
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          role: foundUser.role,
        });
        (cookie as any).auth_token.set({
          value: token,
          httpOnly: true,
          maxAge: 7 * 86400,
          path: '/',
        });

        return { success: true, message: 'Login berhasil' };
      } catch (err: any) {
        console.error('Error during login:', err);
        set.status = 500;
        return { success: false, message: 'Server error' };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .post('/api/auth/logout', ({ cookie }) => {
    (cookie as any).auth_token.remove();
    return { success: true, message: 'Logout berhasil' };
  })
  .get('/api/auth/me', async ({ jwt, cookie, set }) => {
    const user = await verifyAuth(jwt, cookie.auth_token?.value);
    if (!user) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    return { success: true, user };
  })
  .onBeforeHandle(async ({ path, jwt, cookie, set }) => {
    if (path.startsWith('/api/admin')) {
      const user = await verifyAuth(jwt, cookie.auth_token?.value);
      if (!user) {
        set.status = 401;
        return { success: false, message: 'Unauthorized' };
      }
    }
  })
  // USER MANAGEMENT ENDPOINTS (SUPERADMIN ONLY)
  .get('/api/admin/users', async ({ jwt, cookie, set }) => {
    const currentUser = await verifyAuth(jwt, cookie.auth_token?.value);
    if (currentUser?.role !== 'superadmin') {
      set.status = 403;
      return { success: false, message: 'Akses ditolak. Khusus Super Admin.' };
    }
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return { success: true, data: allUsers };
  })
  .post(
    '/api/admin/users',
    async ({ body, jwt, cookie, set }) => {
      try {
        const currentUser = await verifyAuth(jwt, cookie.auth_token?.value);
        if (currentUser?.role !== 'superadmin') {
          set.status = 403;
          return { success: false, message: 'Akses ditolak. Khusus Super Admin.' };
        }

        const { name, username, password, email, role } = body;
        if (!name || !username || !password) {
          set.status = 400;
          return { success: false, message: 'Mohon lengkapi Nama, Username, dan Password.' };
        }

        const existing = await db.select().from(users).where(eq(users.username, username)).then((r) => r[0]);
        if (existing) {
          set.status = 400;
          return { success: false, message: 'Username sudah digunakan.' };
        }

        const hashedPassword = await Bun.password.hash(password);
        await db.insert(users).values({
          name,
          username,
          password: hashedPassword,
          email: email || '',
          role: role || 'admin',
        });

        return { success: true, message: 'User baru berhasil ditambahkan.' };
      } catch (err: any) {
        console.error('Error adding user:', err);
        set.status = 500;
        return { success: false, message: 'Server error' };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        username: t.String(),
        password: t.String(),
        email: t.Optional(t.String()),
        role: t.Optional(t.String()),
      }),
    }
  )
  .post(
    '/api/admin/users/:id/reset-password',
    async ({ params, body, jwt, cookie, set }) => {
      try {
        const currentUser = await verifyAuth(jwt, cookie.auth_token?.value);
        if (currentUser?.role !== 'superadmin') {
          set.status = 403;
          return { success: false, message: 'Akses ditolak. Khusus Super Admin.' };
        }

        const id = Number(params.id);
        const { newPassword } = body;

        if (!id || isNaN(id) || !newPassword) {
          set.status = 400;
          return { success: false, message: 'ID atau Password Baru tidak valid.' };
        }

        const hashedPassword = await Bun.password.hash(newPassword);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));

        return { success: true, message: 'Password user berhasil di-reset.' };
      } catch (err: any) {
        console.error('Error resetting password:', err);
        set.status = 500;
        return { success: false, message: 'Server error' };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ newPassword: t.String() }),
    }
  )
  .delete('/api/admin/users/:id', async ({ params, jwt, cookie, set }) => {
    try {
      const currentUser = await verifyAuth(jwt, cookie.auth_token?.value);
      if (currentUser?.role !== 'superadmin') {
        set.status = 403;
        return { success: false, message: 'Akses ditolak. Khusus Super Admin.' };
      }

      const id = Number(params.id);
      if (!id || isNaN(id)) {
        set.status = 400;
        return { success: false, message: 'ID user tidak valid.' };
      }

      if (id === currentUser.id) {
        set.status = 400;
        return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' };
      }

      await db.delete(users).where(eq(users.id, id));
      return { success: true, message: 'User berhasil dihapus.' };
    } catch (err: any) {
      console.error('Error deleting user:', err);
      set.status = 500;
      return { success: false, message: 'Server error' };
    }
  })
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
        const { patientName, phone, serviceName, address, notes, source } = body;

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
          source: source || 'online',
          status: 'pending',
          createdAt: new Date(),
        });

        return {
          success: true,
          message: 'Booking berhasil diterima!',
          data: { patientName, phone, serviceName, address, source: source || 'online' },
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
        source: t.Optional(t.String()),
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
