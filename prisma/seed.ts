// ============================================================
// ShopSphere — Database Seed
//
// Run with: pnpm db:seed
//
// Creates:
//   - 8 categories
//   - 30 products across categories (with 1-3 images each)
//   - 1 ADMIN user + 2 CUSTOMER users (bcrypt-hashed passwords)
//   - 5-8 orders with OrderItems + Payments (varied statuses & dates)
//
// Money: all prices stored in paise (1 INR = 100 paise)
// Images: https://picsum.photos/seed/<slug>/600/600
// ============================================================

import 'dotenv/config'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

// ─── Bootstrap DB (same URL logic as src/lib/db.ts) ──────────────────────────

function buildLibSQLUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  if (!raw.startsWith('file:')) return raw
  const filePart = raw.slice('file:'.length)
  const absPath = path.isAbsolute(filePart)
    ? filePart
    : path.resolve(process.cwd(), filePart)
  return `file:${absPath}`
}

const adapter = new PrismaLibSql({ url: buildLibSQLUrl() })
const prisma = new PrismaClient({ adapter })

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert INR to paise */
const inr = (rupees: number) => Math.round(rupees * 100)

/** Subtract days from now */
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Smartphones, laptops, audio gear, and more',
    imageUrl: 'https://picsum.photos/seed/electronics/600/400',
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Everyday fashion for men and women',
    imageUrl: 'https://picsum.photos/seed/clothing/600/400',
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Appliances, cookware, and home décor',
    imageUrl: 'https://picsum.photos/seed/home-kitchen/600/400',
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Gear for your active lifestyle',
    imageUrl: 'https://picsum.photos/seed/sports-fitness/600/400',
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Fiction, non-fiction, tech, and more',
    imageUrl: 'https://picsum.photos/seed/books/600/400',
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    description: 'Skincare, hair care, and grooming essentials',
    imageUrl: 'https://picsum.photos/seed/beauty/600/400',
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Fun for all ages',
    imageUrl: 'https://picsum.photos/seed/toys-games/600/400',
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Sneakers, sandals, formal shoes, and boots',
    imageUrl: 'https://picsum.photos/seed/footwear/600/400',
  },
]

interface ProductSeed {
  name: string
  slug: string
  description: string
  price: number        // INR
  compareAtPrice?: number // INR — sale original price
  stock: number
  categorySlug: string
  featured: boolean
  ratingAvg: number
  images: string[]     // slugs for picsum
}

const products: ProductSeed[] = [
  // ── Electronics ────────────────────────────────────────────
  {
    name: 'ProSound Wireless Headphones',
    slug: 'prosound-wireless-headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res audio certification. Foldable design for travel.',
    price: 8999,
    compareAtPrice: 12999,
    stock: 45,
    categorySlug: 'electronics',
    featured: true,
    ratingAvg: 4.6,
    images: ['prosound-wireless-headphones', 'prosound-headphones-detail', 'prosound-headphones-case'],
  },
  {
    name: 'Nova 14 Ultrabook',
    slug: 'nova-14-ultrabook',
    description: '14-inch FHD IPS display, Intel Core i7, 16 GB RAM, 512 GB NVMe SSD. Weighs just 1.2 kg. All-day battery up to 18 hours.',
    price: 74999,
    compareAtPrice: 89999,
    stock: 12,
    categorySlug: 'electronics',
    featured: true,
    ratingAvg: 4.8,
    images: ['nova-14-ultrabook', 'nova-14-keyboard', 'nova-14-ports'],
  },
  {
    name: 'SnapX Pro Wireless Mouse',
    slug: 'snapx-pro-wireless-mouse',
    description: 'Ergonomic wireless mouse with 4000 DPI optical sensor, 6 programmable buttons, and 90-day battery life on a single AA cell.',
    price: 1299,
    stock: 200,
    categorySlug: 'electronics',
    featured: false,
    ratingAvg: 4.3,
    images: ['snapx-pro-wireless-mouse', 'snapx-mouse-side'],
  },
  {
    name: 'ClearView 4K Webcam',
    slug: 'clearview-4k-webcam',
    description: 'Crystal-clear 4K UHD webcam with auto-focus, built-in noise-cancelling microphone, and privacy shutter. Plug-and-play USB-C.',
    price: 5499,
    compareAtPrice: 6999,
    stock: 78,
    categorySlug: 'electronics',
    featured: false,
    ratingAvg: 4.5,
    images: ['clearview-4k-webcam', 'clearview-webcam-mount'],
  },

  // ── Clothing ───────────────────────────────────────────────
  {
    name: 'Urban Slim-Fit Chinos',
    slug: 'urban-slim-fit-chinos',
    description: 'Stretch-cotton slim-fit chinos in a versatile mid-khaki. Machine washable, wrinkle-resistant. Available in waist 28–40.',
    price: 1799,
    compareAtPrice: 2499,
    stock: 130,
    categorySlug: 'clothing',
    featured: true,
    ratingAvg: 4.4,
    images: ['urban-slim-fit-chinos', 'urban-chinos-back'],
  },
  {
    name: 'CloudSoft Oversized Hoodie',
    slug: 'cloudsoft-oversized-hoodie',
    description: '450 GSM French-terry cotton fleece. Dropped shoulders, kangaroo pocket, and ribbed cuffs. Preshrunk — size true to chart.',
    price: 2199,
    stock: 95,
    categorySlug: 'clothing',
    featured: false,
    ratingAvg: 4.7,
    images: ['cloudsoft-oversized-hoodie', 'cloudsoft-hoodie-front', 'cloudsoft-hoodie-tag'],
  },
  {
    name: 'FlexMove Athletic T-Shirt',
    slug: 'flexmove-athletic-tshirt',
    description: 'Quick-dry polyester mesh blend. Flatlock seams prevent chafing. Moisture-wicking and anti-odour treatment. Ideal for gym and runs.',
    price: 799,
    compareAtPrice: 1199,
    stock: 220,
    categorySlug: 'clothing',
    featured: false,
    ratingAvg: 4.2,
    images: ['flexmove-athletic-tshirt', 'flexmove-tshirt-back'],
  },
  {
    name: 'Heritage Denim Jacket',
    slug: 'heritage-denim-jacket',
    description: '100% cotton indigo-dye denim, medium wash. Classic trucker cut with chest pockets and adjustable side tabs. Pre-washed for softness.',
    price: 3499,
    compareAtPrice: 4999,
    stock: 60,
    categorySlug: 'clothing',
    featured: true,
    ratingAvg: 4.6,
    images: ['heritage-denim-jacket', 'heritage-denim-detail', 'heritage-denim-buttons'],
  },

  // ── Home & Kitchen ─────────────────────────────────────────
  {
    name: 'BrewMaster Pour-Over Set',
    slug: 'brewmaster-pour-over-set',
    description: 'Borosilicate glass dripper, gooseneck kettle, and 100 bleached filters. Everything you need for a perfect manual brew.',
    price: 2299,
    stock: 55,
    categorySlug: 'home-kitchen',
    featured: true,
    ratingAvg: 4.8,
    images: ['brewmaster-pour-over-set', 'brewmaster-kettle', 'brewmaster-glass'],
  },
  {
    name: 'StainShield Non-Stick Pan Set',
    slug: 'stainshield-nonstick-pan-set',
    description: '3-piece set (20 cm, 24 cm, 28 cm). PFOA-free ceramic coating, induction-compatible base, heat-resistant bakelite handles.',
    price: 3799,
    compareAtPrice: 5499,
    stock: 40,
    categorySlug: 'home-kitchen',
    featured: false,
    ratingAvg: 4.5,
    images: ['stainshield-nonstick-pan-set', 'stainshield-pans-stack'],
  },
  {
    name: 'QuietZone Air Purifier',
    slug: 'quietzone-air-purifier',
    description: 'True HEPA H13 + activated carbon filter. Covers 450 sq ft. Ultra-quiet 22 dB sleep mode. Auto air-quality sensor and PM2.5 display.',
    price: 11999,
    compareAtPrice: 15999,
    stock: 28,
    categorySlug: 'home-kitchen',
    featured: true,
    ratingAvg: 4.7,
    images: ['quietzone-air-purifier', 'quietzone-filter', 'quietzone-display'],
  },
  {
    name: 'Nordic Scented Candle Trio',
    slug: 'nordic-scented-candle-trio',
    description: 'Set of 3 soy-wax candles: Pine & Cedar, Sandalwood Amber, and White Tea. 40-hour burn time each. Handpoured in Scandinavia.',
    price: 1299,
    stock: 150,
    categorySlug: 'home-kitchen',
    featured: false,
    ratingAvg: 4.9,
    images: ['nordic-scented-candle-trio', 'nordic-candles-lit'],
  },

  // ── Sports & Fitness ───────────────────────────────────────
  {
    name: 'IronCore Adjustable Dumbbell Set',
    slug: 'ironcore-adjustable-dumbbell-set',
    description: 'Dial-select system adjusts from 2.5 kg to 24 kg in 2.5 kg increments. Replaces 9 pairs of dumbbells. Compact storage tray included.',
    price: 18999,
    compareAtPrice: 24999,
    stock: 18,
    categorySlug: 'sports-fitness',
    featured: true,
    ratingAvg: 4.7,
    images: ['ironcore-adjustable-dumbbell-set', 'ironcore-dial', 'ironcore-tray'],
  },
  {
    name: 'FlowYoga Premium Mat',
    slug: 'flowyoga-premium-mat',
    description: '6 mm dual-layer TPE foam. Non-slip texture, moisture-resistant, and latex-free. Includes alignment lines and carry strap.',
    price: 1599,
    stock: 110,
    categorySlug: 'sports-fitness',
    featured: false,
    ratingAvg: 4.5,
    images: ['flowyoga-premium-mat', 'flowyoga-mat-rolled'],
  },
  {
    name: 'PacePro GPS Running Watch',
    slug: 'pacepro-gps-running-watch',
    description: 'Built-in GPS, heart-rate monitor, VO2 max estimation, and 20-sport modes. 14-day battery in smartwatch mode. 50 m water resistant.',
    price: 15999,
    compareAtPrice: 19999,
    stock: 35,
    categorySlug: 'sports-fitness',
    featured: true,
    ratingAvg: 4.6,
    images: ['pacepro-gps-running-watch', 'pacepro-display', 'pacepro-band'],
  },
  {
    name: 'ResistFlex Loop Band Set',
    slug: 'resistflex-loop-band-set',
    description: 'Set of 5 fabric resistance bands: 5 kg, 10 kg, 15 kg, 20 kg, 25 kg resistance. Non-slip grip, skin-safe material. Carry pouch included.',
    price: 699,
    stock: 300,
    categorySlug: 'sports-fitness',
    featured: false,
    ratingAvg: 4.3,
    images: ['resistflex-loop-band-set'],
  },

  // ── Books ──────────────────────────────────────────────────
  {
    name: 'Clean Code (Paperback)',
    slug: 'clean-code-paperback',
    description: 'Robert C. Martin\'s classic guide to writing readable, maintainable software. Essential reading for every software engineer.',
    price: 699,
    compareAtPrice: 999,
    stock: 80,
    categorySlug: 'books',
    featured: false,
    ratingAvg: 4.8,
    images: ['clean-code-paperback'],
  },
  {
    name: 'The Psychology of Money',
    slug: 'psychology-of-money',
    description: 'Morgan Housel explores the strange ways people think about money and teaches you how to make better sense of one of life\'s most important topics.',
    price: 499,
    stock: 95,
    categorySlug: 'books',
    featured: true,
    ratingAvg: 4.9,
    images: ['psychology-of-money', 'psychology-money-inside'],
  },
  {
    name: 'Atomic Habits',
    slug: 'atomic-habits',
    description: 'James Clear\'s #1 New York Times bestseller. A proven framework for improving every day. Practical strategies that will teach you how to form good habits.',
    price: 549,
    compareAtPrice: 799,
    stock: 120,
    categorySlug: 'books',
    featured: true,
    ratingAvg: 4.9,
    images: ['atomic-habits', 'atomic-habits-back'],
  },
  {
    name: 'Designing Data-Intensive Applications',
    slug: 'designing-data-intensive-apps',
    description: 'Martin Kleppmann\'s authoritative guide to distributed systems, databases, and data engineering. Covers replication, partitioning, transactions, and more.',
    price: 2199,
    compareAtPrice: 2999,
    stock: 45,
    categorySlug: 'books',
    featured: false,
    ratingAvg: 4.8,
    images: ['designing-data-intensive-apps'],
  },

  // ── Beauty & Personal Care ──────────────────────────────────
  {
    name: 'VitaGlow Vitamin C Serum',
    slug: 'vitaglow-vitamin-c-serum',
    description: '20% L-ascorbic acid serum with hyaluronic acid and ferulic acid. Brightens, protects, and visibly reduces dark spots in 4 weeks.',
    price: 1499,
    compareAtPrice: 1999,
    stock: 85,
    categorySlug: 'beauty',
    featured: true,
    ratingAvg: 4.6,
    images: ['vitaglow-vitamin-c-serum', 'vitaglow-bottle', 'vitaglow-texture'],
  },
  {
    name: 'HydraLock SPF50 Sunscreen',
    slug: 'hydralock-spf50-sunscreen',
    description: 'Lightweight, non-greasy SPF50 PA++++. Zinc-based broad spectrum. Suitable for oily and sensitive skin. No white cast.',
    price: 799,
    stock: 200,
    categorySlug: 'beauty',
    featured: false,
    ratingAvg: 4.5,
    images: ['hydralock-spf50-sunscreen', 'hydralock-texture'],
  },
  {
    name: 'SilkSmooth Hair Mask',
    slug: 'silksmooth-hair-mask',
    description: 'Deep conditioning treatment with argan oil, keratin, and shea butter. Repairs split ends and reduces frizz. Use weekly for best results. 200 ml.',
    price: 649,
    compareAtPrice: 899,
    stock: 130,
    categorySlug: 'beauty',
    featured: false,
    ratingAvg: 4.4,
    images: ['silksmooth-hair-mask'],
  },

  // ── Toys & Games ───────────────────────────────────────────
  {
    name: 'Stellar Blocks 200-Piece Set',
    slug: 'stellar-blocks-200-piece',
    description: 'BPA-free interlocking building blocks in 12 vibrant colours. Compatible with major brick brands. Storage bucket included. Ages 3+.',
    price: 1199,
    stock: 70,
    categorySlug: 'toys-games',
    featured: false,
    ratingAvg: 4.7,
    images: ['stellar-blocks-200-piece', 'stellar-blocks-built'],
  },
  {
    name: 'Catan Board Game',
    slug: 'catan-board-game',
    description: 'The world\'s best-selling strategy board game. Build settlements, trade resources, and expand your civilization. 3-4 players, ages 10+. Approx 90 min.',
    price: 2799,
    compareAtPrice: 3499,
    stock: 40,
    categorySlug: 'toys-games',
    featured: true,
    ratingAvg: 4.8,
    images: ['catan-board-game', 'catan-board-detail', 'catan-cards'],
  },
  {
    name: 'RC Drift Car Pro',
    slug: 'rc-drift-car-pro',
    description: '1:16 scale brushless RC drift car. 45 km/h top speed, 4-wheel drive, 2.4 GHz radio, and drift tyres. Lithium battery + 90 min charge time.',
    price: 4599,
    compareAtPrice: 5999,
    stock: 25,
    categorySlug: 'toys-games',
    featured: false,
    ratingAvg: 4.5,
    images: ['rc-drift-car-pro', 'rc-drift-car-side'],
  },

  // ── Footwear ───────────────────────────────────────────────
  {
    name: 'CloudStep Everyday Sneakers',
    slug: 'cloudstep-everyday-sneakers',
    description: 'Memory-foam insole with knit upper for all-day comfort. Lightweight EVA outsole, slip-on elastic lacing. Available sizes 6–12.',
    price: 2299,
    compareAtPrice: 2999,
    stock: 90,
    categorySlug: 'footwear',
    featured: true,
    ratingAvg: 4.6,
    images: ['cloudstep-everyday-sneakers', 'cloudstep-sneakers-sole', 'cloudstep-sneakers-side'],
  },
  {
    name: 'TrailBlaze Hiking Boots',
    slug: 'trailblaze-hiking-boots',
    description: 'Waterproof leather upper with Vibram outsole. Ankle support and cushioned midsole. Rated for trails up to Grade 3. Sizes 7–13.',
    price: 5999,
    compareAtPrice: 7999,
    stock: 32,
    categorySlug: 'footwear',
    featured: true,
    ratingAvg: 4.7,
    images: ['trailblaze-hiking-boots', 'trailblaze-boots-sole', 'trailblaze-boots-detail'],
  },
  {
    name: 'SlipEase Leather Loafers',
    slug: 'slipease-leather-loafers',
    description: 'Full-grain calfskin leather loafers with leather sole and cushioned footbed. Business-casual to formal. Available in black and cognac.',
    price: 3999,
    stock: 55,
    categorySlug: 'footwear',
    featured: false,
    ratingAvg: 4.5,
    images: ['slipease-leather-loafers', 'slipease-loafers-bottom'],
  },
  {
    name: 'ThermoBreeze Smart Bottle',
    slug: 'thermobreeze-smart-bottle',
    description: 'Double-walled stainless steel bottle with LED temperature display. Keeps beverages cold 24 h and hot 12 h. 500 ml. BPA-free, leakproof lid.',
    price: 1899,
    compareAtPrice: 2499,
    stock: 120,
    categorySlug: 'home-kitchen',
    featured: false,
    ratingAvg: 4.6,
    images: ['thermobreeze-smart-bottle', 'thermobreeze-bottle-lid'],
  },
]

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding ShopSphere database...\n')

  // ── 1. Categories ────────────────────────────────────────────
  console.log('Creating categories...')
  const categoryMap: Record<string, string> = {}

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    categoryMap[cat.slug] = created.id
  }
  console.log(`  ${categories.length} categories done`)

  // ── 2. Products ──────────────────────────────────────────────
  console.log('Creating products...')
  const productMap: Record<string, { id: string; price: number; name: string }> = {}

  for (const p of products) {
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: inr(p.price),
        compareAtPrice: p.compareAtPrice ? inr(p.compareAtPrice) : null,
        stock: p.stock,
        categoryId: categoryMap[p.categorySlug],
        featured: p.featured,
        ratingAvg: p.ratingAvg,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: inr(p.price),
        compareAtPrice: p.compareAtPrice ? inr(p.compareAtPrice) : null,
        stock: p.stock,
        categoryId: categoryMap[p.categorySlug],
        featured: p.featured,
        ratingAvg: p.ratingAvg,
      },
    })
    productMap[p.slug] = { id: created.id, price: inr(p.price), name: p.name }

    // Upsert images: delete existing then re-create to keep positions stable
    await prisma.productImage.deleteMany({ where: { productId: created.id } })
    for (let i = 0; i < p.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: created.id,
          url: `https://picsum.photos/seed/${p.images[i]}/600/600`,
          position: i,
        },
      })
    }
  }
  console.log(`  ${products.length} products + images done`)

  // ── 3. Users ─────────────────────────────────────────────────
  console.log('Creating users...')

  const SALT_ROUNDS = 10

  const adminHash = await bcrypt.hash('Admin@1234', SALT_ROUNDS)
  const customer1Hash = await bcrypt.hash('Customer@1234', SALT_ROUNDS)
  const customer2Hash = await bcrypt.hash('Customer@5678', SALT_ROUNDS)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shopsphere.dev' },
    update: { passwordHash: adminHash, name: 'Shop Admin', role: 'ADMIN' },
    create: {
      email: 'admin@shopsphere.dev',
      passwordHash: adminHash,
      name: 'Shop Admin',
      role: 'ADMIN',
    },
  })

  const customer1 = await prisma.user.upsert({
    where: { email: 'priya@example.com' },
    update: { passwordHash: customer1Hash, name: 'Priya Sharma', role: 'CUSTOMER' },
    create: {
      email: 'priya@example.com',
      passwordHash: customer1Hash,
      name: 'Priya Sharma',
      role: 'CUSTOMER',
    },
  })

  const customer2 = await prisma.user.upsert({
    where: { email: 'arjun@example.com' },
    update: { passwordHash: customer2Hash, name: 'Arjun Mehta', role: 'CUSTOMER' },
    create: {
      email: 'arjun@example.com',
      passwordHash: customer2Hash,
      name: 'Arjun Mehta',
      role: 'CUSTOMER',
    },
  })

  console.log('  3 users done')

  // ── 4. Sample Orders ─────────────────────────────────────────
  console.log('Creating sample orders...')

  // Delete existing orders (cascade deletes OrderItems and Payments)
  await prisma.order.deleteMany({ where: { userId: { in: [customer1.id, customer2.id] } } })

  interface OrderSpec {
    userId: string
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    daysAgoCreated: number
    shippingFeeINR: number
    paymentProvider: 'mock-stripe' | 'mock-razorpay'
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
    items: Array<{ slug: string; quantity: number }>
    shippingName: string
    shippingAddress: string
    shippingCity: string
    shippingPincode: string
  }

  const orderSpecs: OrderSpec[] = [
    {
      userId: customer1.id,
      status: 'DELIVERED',
      daysAgoCreated: 30,
      shippingFeeINR: 49,
      paymentProvider: 'mock-stripe',
      paymentStatus: 'PAID',
      shippingName: 'Priya Sharma',
      shippingAddress: '12, Rose Garden Society, Sector 14',
      shippingCity: 'Gurugram',
      shippingPincode: '122001',
      items: [
        { slug: 'prosound-wireless-headphones', quantity: 1 },
        { slug: 'cloudsoft-oversized-hoodie', quantity: 2 },
      ],
    },
    {
      userId: customer1.id,
      status: 'SHIPPED',
      daysAgoCreated: 8,
      shippingFeeINR: 49,
      paymentProvider: 'mock-razorpay',
      paymentStatus: 'PAID',
      shippingName: 'Priya Sharma',
      shippingAddress: '12, Rose Garden Society, Sector 14',
      shippingCity: 'Gurugram',
      shippingPincode: '122001',
      items: [
        { slug: 'atomic-habits', quantity: 1 },
        { slug: 'psychology-of-money', quantity: 1 },
        { slug: 'vitaglow-vitamin-c-serum', quantity: 1 },
      ],
    },
    {
      userId: customer1.id,
      status: 'PAID',
      daysAgoCreated: 2,
      shippingFeeINR: 0,
      paymentProvider: 'mock-stripe',
      paymentStatus: 'PAID',
      shippingName: 'Priya Sharma',
      shippingAddress: '12, Rose Garden Society, Sector 14',
      shippingCity: 'Gurugram',
      shippingPincode: '122001',
      items: [{ slug: 'nova-14-ultrabook', quantity: 1 }],
    },
    {
      userId: customer1.id,
      status: 'PENDING',
      daysAgoCreated: 0,
      shippingFeeINR: 49,
      paymentProvider: 'mock-razorpay',
      paymentStatus: 'PENDING',
      shippingName: 'Priya Sharma',
      shippingAddress: '12, Rose Garden Society, Sector 14',
      shippingCity: 'Gurugram',
      shippingPincode: '122001',
      items: [
        { slug: 'cloudstep-everyday-sneakers', quantity: 1 },
        { slug: 'hydralock-spf50-sunscreen', quantity: 2 },
      ],
    },
    {
      userId: customer2.id,
      status: 'DELIVERED',
      daysAgoCreated: 45,
      shippingFeeINR: 49,
      paymentProvider: 'mock-stripe',
      paymentStatus: 'PAID',
      shippingName: 'Arjun Mehta',
      shippingAddress: '7B, Sunflower Apartments, MG Road',
      shippingCity: 'Bangalore',
      shippingPincode: '560001',
      items: [
        { slug: 'ironcore-adjustable-dumbbell-set', quantity: 1 },
        { slug: 'flowyoga-premium-mat', quantity: 1 },
      ],
    },
    {
      userId: customer2.id,
      status: 'DELIVERED',
      daysAgoCreated: 20,
      shippingFeeINR: 0,
      paymentProvider: 'mock-razorpay',
      paymentStatus: 'PAID',
      shippingName: 'Arjun Mehta',
      shippingAddress: '7B, Sunflower Apartments, MG Road',
      shippingCity: 'Bangalore',
      shippingPincode: '560001',
      items: [
        { slug: 'catan-board-game', quantity: 1 },
        { slug: 'stellar-blocks-200-piece', quantity: 1 },
      ],
    },
    {
      userId: customer2.id,
      status: 'SHIPPED',
      daysAgoCreated: 5,
      shippingFeeINR: 49,
      paymentProvider: 'mock-stripe',
      paymentStatus: 'PAID',
      shippingName: 'Arjun Mehta',
      shippingAddress: '7B, Sunflower Apartments, MG Road',
      shippingCity: 'Bangalore',
      shippingPincode: '560001',
      items: [
        { slug: 'trailblaze-hiking-boots', quantity: 1 },
        { slug: 'resistflex-loop-band-set', quantity: 2 },
      ],
    },
    {
      userId: customer2.id,
      status: 'CANCELLED',
      daysAgoCreated: 15,
      shippingFeeINR: 49,
      paymentProvider: 'mock-razorpay',
      paymentStatus: 'FAILED',
      shippingName: 'Arjun Mehta',
      shippingAddress: '7B, Sunflower Apartments, MG Road',
      shippingCity: 'Bangalore',
      shippingPincode: '560001',
      items: [{ slug: 'pacepro-gps-running-watch', quantity: 1 }],
    },
  ]

  for (const spec of orderSpecs) {
    let subtotal = 0
    const itemsData = spec.items.map(({ slug, quantity }) => {
      const prod = productMap[slug]
      subtotal += prod.price * quantity
      return {
        productId: prod.id,
        name: prod.name,
        unitPrice: prod.price,
        quantity,
      }
    })

    const shippingFee = inr(spec.shippingFeeINR)
    const total = subtotal + shippingFee
    const createdAt = daysAgo(spec.daysAgoCreated)

    const order = await prisma.order.create({
      data: {
        userId: spec.userId,
        status: spec.status,
        subtotal,
        shippingFee,
        total,
        shippingName: spec.shippingName,
        shippingAddress: spec.shippingAddress,
        shippingCity: spec.shippingCity,
        shippingPincode: spec.shippingPincode,
        createdAt,
        updatedAt: createdAt,
        items: { create: itemsData },
        payment: {
          create: {
            amount: total,
            status: spec.paymentStatus,
            provider: spec.paymentProvider,
            createdAt,
            updatedAt: createdAt,
          },
        },
      },
    })

    void order // suppress unused variable lint
  }

  console.log(`  ${orderSpecs.length} orders + order items + payments done`)

  // ── 5. Summary ───────────────────────────────────────────────
  const [userCount, categoryCount, productCount, imageCount, orderCount, orderItemCount, paymentCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.payment.count(),
    ])

  console.log('\n┌─────────────────────────────────────────┐')
  console.log('│          ShopSphere Seed Complete        │')
  console.log('├─────────────────────────────────────────┤')
  console.log(`│  users          : ${String(userCount).padStart(4)}                   │`)
  console.log(`│  categories     : ${String(categoryCount).padStart(4)}                   │`)
  console.log(`│  products       : ${String(productCount).padStart(4)}                   │`)
  console.log(`│  product images : ${String(imageCount).padStart(4)}                   │`)
  console.log(`│  orders         : ${String(orderCount).padStart(4)}                   │`)
  console.log(`│  order items    : ${String(orderItemCount).padStart(4)}                   │`)
  console.log(`│  payments       : ${String(paymentCount).padStart(4)}                   │`)
  console.log('├─────────────────────────────────────────┤')
  console.log('│  Demo credentials                        │')
  console.log('│  ADMIN    admin@shopsphere.dev           │')
  console.log('│           Admin@1234                     │')
  console.log('│  CUSTOMER priya@example.com              │')
  console.log('│           Customer@1234                  │')
  console.log('│  CUSTOMER arjun@example.com              │')
  console.log('│           Customer@5678                  │')
  console.log('└─────────────────────────────────────────┘\n')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
