// 20 preloaded products (mix of categories)
// Images: using Unsplash source URLs (free, no auth needed)

const products = [
  // Electronics
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery, and studio-quality sound.',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    category: 'Electronics',
    stock: 50,
  },
  {
    name: 'Mechanical Keyboard',
    description: 'TKL mechanical keyboard with RGB backlight, Cherry MX switches, and aluminium frame.',
    price: 3999,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    category: 'Electronics',
    stock: 40,
  },
  {
    name: 'USB-C Laptop Stand',
    description: 'Adjustable aluminium laptop stand with built-in USB hub, compatible with all 13–17" laptops.',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80',
    category: 'Electronics',
    stock: 80,
  },
  {
    name: 'Smartwatch Pro',
    description: 'Always-on AMOLED display, blood-oxygen monitor, GPS, and 7-day battery life.',
    price: 8999,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    category: 'Electronics',
    stock: 30,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'IPX7 waterproof speaker with 360-degree sound, 20-hour playtime, and dual pairing.',
    price: 1799,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
    category: 'Electronics',
    stock: 60,
  },

  // Books
  {
    name: 'Clean Code – Robert C. Martin',
    description: 'A handbook of agile software craftsmanship. Every developer\'s must-read for writing maintainable, elegant code.',
    price: 499,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    category: 'Books',
    stock: 200,
  },
  {
    name: 'System Design Interview Vol. 2',
    description: 'In-depth coverage of distributed systems, scalability patterns, and real-world architecture decisions.',
    price: 699,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    category: 'Books',
    stock: 150,
  },
  {
    name: 'Atomic Habits',
    description: 'An easy & proven way to build good habits & break bad ones. Over 10 million copies sold worldwide.',
    price: 349,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
    category: 'Books',
    stock: 300,
  },

  // Clothing
  {
    name: 'Premium Cotton Hoodie',
    description: '400gsm heavyweight cotton hoodie with kangaroo pocket and brushed fleece interior. Unisex fit.',
    price: 1499,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80',
    category: 'Clothing',
    stock: 100,
  },
  {
    name: 'Slim Fit Chinos',
    description: 'Stretch cotton chinos in a modern slim fit. Wrinkle-resistant and machine washable.',
    price: 999,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80',
    category: 'Clothing',
    stock: 120,
  },
  {
    name: 'Running Shoes – Air Max Style',
    description: 'Lightweight mesh upper with responsive foam cushioning. Breathable and energy-returning sole.',
    price: 2999,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    category: 'Clothing',
    stock: 70,
  },

  // Home & Kitchen
  {
    name: 'Stainless Steel Water Bottle 1L',
    description: 'Double-wall vacuum insulated. Keeps drinks cold 24hrs and hot 12hrs. BPA-free.',
    price: 599,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
    category: 'Home & Kitchen',
    stock: 200,
  },
  {
    name: 'Pour-Over Coffee Set',
    description: 'Includes borosilicate glass dripper, stainless steel filter, and server. Perfect for specialty coffee.',
    price: 1199,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    category: 'Home & Kitchen',
    stock: 60,
  },
  {
    name: 'Cast Iron Skillet 10"',
    description: 'Pre-seasoned cast iron with heat-resistant handle. Works on all cooktops including induction.',
    price: 1599,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    category: 'Home & Kitchen',
    stock: 45,
  },
  {
    name: 'Wooden Desk Organiser',
    description: 'Handcrafted bamboo desk organiser with 5 compartments, pen holder, and phone stand.',
    price: 799,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80',
    category: 'Home & Kitchen',
    stock: 90,
  },

  // Fitness
  {
    name: 'Adjustable Dumbbell Set 20kg',
    description: 'Quick-select adjustment from 2kg to 20kg. Replaces 10 pairs of dumbbells. Includes stand.',
    price: 5999,
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80',
    category: 'Fitness',
    stock: 25,
  },
  {
    name: 'Yoga Mat Premium 6mm',
    description: 'Non-slip TPE yoga mat with alignment lines, carrying strap, and extra thick cushioning.',
    price: 899,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80',
    category: 'Fitness',
    stock: 110,
  },
  {
    name: 'Resistance Bands Set',
    description: 'Set of 5 loop bands (10–50lb) with carry bag, handles, and door anchor. Latex-free.',
    price: 699,
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&q=80',
    category: 'Fitness',
    stock: 150,
  },

  // Stationery
  {
    name: 'Leather Bound Journal A5',
    description: 'Genuine leather journal with 200 pages of dotted Tomoe River paper. Bookmark ribbon included.',
    price: 999,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&q=80',
    category: 'Stationery',
    stock: 80,
  },
  {
    name: 'Fountain Pen – Gold Nib',
    description: '18k gold medium nib fountain pen with piston filler. Includes converter and 3 ink cartridges.',
    price: 2199,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&q=80',
    category: 'Stationery',
    stock: 35,
  },
];

module.exports = products;
