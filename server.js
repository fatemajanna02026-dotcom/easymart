const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nobodeal";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==================== MODELS ====================
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Category = require("./models/Category");
const PageLayout = require("./models/PageLayout");

const orderSchema = new mongoose.Schema({
  id: String,
  date: Date,
  status: String,
  userEmail: String,
  userName: String,
  userPhone: String,
  userAddress: String,
  items: Array,
  subtotal: Number, // ← যোগ করুন
  deliveryFee: Number, // ← যোগ করুন
  deliveryZone: String, // ← যোগ করুন (inside/outside)
  total: Number,
  paymentMethod: String,
  latitude: Number,
  longitude: Number,
});

// ---------- LayoutSection Model ----------
const layoutSectionSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  enabled: Boolean,
  order: Number,
  bg: { type: String, default: "#ffffff" },
  padding: { type: String, default: "40px 0" },
});
const LayoutSection = mongoose.model("LayoutSection", layoutSectionSchema);

// ---------- Complete Setting Model (Advanced Settings) ----------
const settingSchema = new mongoose.Schema(
  {
    // General
    siteName: { type: String, default: "AI Store" },
    tagline: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    currencySymbol: { type: String, default: "$" },
    currencyCode: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    openRouterApiKey: { type: String, default: "" },
    googleMapsKey: { type: String, default: "" },

    // Design
    primaryColor: { type: String, default: "#e94560" },
    secondaryColor: { type: String, default: "#1a1a2e" },
    accentColor: { type: String, default: "#f39c12" },
    successColor: { type: String, default: "#2ecc71" },
    dangerColor: { type: String, default: "#e74c3c" },
    bgColor: { type: String, default: "#f8f9fa" },
    cardBg: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#333333" },
    darkMode: { type: Boolean, default: false },
    fontFamily: { type: String, default: "'Poppins', sans-serif" },
    headingFont: { type: String, default: "" },
    baseFontSize: { type: String, default: "16px" },
    lineHeight: { type: String, default: "1.6" },
    borderRadius: { type: String, default: "8px" },
    boxShadow: { type: String, default: "0 4px 12px rgba(0,0,0,0.1)" },
    animationSpeed: { type: String, default: "0.3s" },
    containerMaxWidth: { type: String, default: "1200px" },
    footerText: { type: String, default: "© 2026 AI Store" },

    // SEO & Analytics
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    googleAnalyticsId: { type: String, default: "" },
    fbPixelId: { type: String, default: "" },
    tiktokPixelId: { type: String, default: "" },
    hotjarId: { type: String, default: "" },
    sitemapEnabled: { type: Boolean, default: true },
    robotsEnabled: { type: Boolean, default: true },
    schemaEnabled: { type: Boolean, default: false },

    // Payment Methods
    enableCOD: { type: Boolean, default: true },
    enableStripe: { type: Boolean, default: false },
    enablePayPal: { type: Boolean, default: false },
    enableBkash: { type: Boolean, default: false },
    enableNagad: { type: Boolean, default: false },
    enableSSLCommerz: { type: Boolean, default: false },
    stripePublishableKey: { type: String, default: "" },
    stripeSecretKey: { type: String, default: "" },
    bkashAppKey: { type: String, default: "" },
    bkashAppSecret: { type: String, default: "" },
    bkashUsername: { type: String, default: "" },
    bkashPassword: { type: String, default: "" },
    taxRate: { type: Number, default: 0 },
    taxIncluded: { type: Boolean, default: false },

    // Shipping
    defaultShipping: { type: Number, default: 0 },
    freeShippingMinimum: { type: Number, default: 0 },
    dhakaShipping: { type: Number, default: 60 },
    outsideDhakaShipping: { type: Number, default: 120 },
    internationalShipping: { type: Number, default: 500 },
    enableLocalPickup: { type: Boolean, default: false },
    deliveryMin: { type: Number, default: 3 },
    deliveryMax: { type: Number, default: 7 },
    shippingMessage: { type: String, default: "" },

    // Email (SMTP & Notifications)
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: "" },
    smtpPassword: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
    emailOrderConfirm: { type: Boolean, default: true },
    emailShipNotify: { type: Boolean, default: true },
    emailDelivered: { type: Boolean, default: true },
    emailNewUser: { type: Boolean, default: true },
    emailAdminNewOrder: { type: Boolean, default: true },
    emailLowStock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5 },

    // Social Media
    facebookUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    twitterUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    tiktokUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    pinterestUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    telegramUrl: { type: String, default: "" },
    googleLogin: { type: Boolean, default: false },
    googleClientId: { type: String, default: "" },
    facebookLogin: { type: Boolean, default: false },
    facebookAppId: { type: String, default: "" },

    // Popup & Chat
    enableChat: { type: Boolean, default: false },
    chatPosition: { type: String, default: "bottom-right" },
    chatBotName: { type: String, default: "Support Bot" },
    chatWelcome: { type: String, default: "" },
    enablePopup: { type: Boolean, default: false },
    popupTitle: { type: String, default: "" },
    popupMessage: { type: String, default: "" },
    popupDelay: { type: Number, default: 3 },
    showOnExitIntent: { type: Boolean, default: false },
    announcementBar: { type: Boolean, default: false },
    announcementText: { type: String, default: "" },
    announcementBg: { type: String, default: "#e94560" },

    // Store Features
    enableReviews: { type: Boolean, default: true },
    enableWishlist: { type: Boolean, default: true },
    enableCompare: { type: Boolean, default: false },
    enableMultiCurrency: { type: Boolean, default: false },
    enableMultiLanguage: { type: Boolean, default: false },
    enableGuestCheckout: { type: Boolean, default: false },
    enableCoupon: { type: Boolean, default: false },
    enableLoyaltyPoints: { type: Boolean, default: false },
    enableStockAlert: { type: Boolean, default: false },
    enableAffiliate: { type: Boolean, default: false },
    enableProductZoom: { type: Boolean, default: false },
    enableQuickView: { type: Boolean, default: false },
    enableSizeGuide: { type: Boolean, default: false },
    enableReturnPolicy: { type: Boolean, default: false },
    enableMaintenance: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "We'll be back soon!" },

    // Custom Code
    customCSS: { type: String, default: "" },
    customJS: { type: String, default: "" },
    customHTML: { type: String, default: "" },

    // Homepage & Navbar
    navbarMaxVisible: { type: Number, default: 5 },
    featuredProductIds: { type: [Number], default: [] },
    sliderAutoPlay: { type: Boolean, default: true },
    sliderInterval: { type: Number, default: 4500 },
    sliderShowArrows: { type: Boolean, default: true },
    sliderShowDots: { type: Boolean, default: true },
    categoryMessages: { type: Object, default: {} },

    // Additional
    promoBanner: {
      text: { type: String, default: "" },
      bg: { type: String, default: "#e94560" },
      link: { type: String, default: "" },
      visible: { type: Boolean, default: true },
    },
    productsPerRow: { type: String, default: "4" },
    googleFontUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

const Setting = mongoose.model("Setting", settingSchema);

// ==================== MULTER (memory storage) ====================
const upload = multer({ storage: multer.memoryStorage() });

// ==================== NODEMAILER TRANSPORTER ====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const otpStore = {};

// ==================== USER ROUTES ====================
app.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing)
      return res.json({ success: false, message: "Email already exists!" });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const role = email === "sabbirmolla801@gmail.com" ? "admin" : "user";
    const newUser = new User({
      name,
      email,
      password,
      role,
      loginCount: 0,
      lastLogin: null,
      lastIp: ip,
      orderCount: 0,
      profilePicture: "",
      defaultAddress: "",
      defaultPhone: "",
    });
    await newUser.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email, password });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    user.lastIp = ip;
    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    const { password: pwd, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    let { email } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}`,
    });
    res.json({ success: true, message: "OTP sent to your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    email = email.toLowerCase().trim();
    if (otpStore[email] !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP!" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    user.password = newPassword;
    await user.save();
    delete otpStore[email];
    res.json({ success: true, message: "Password updated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/user/sync", (req, res) => res.json({ success: true }));

// ==================== PRODUCT ROUTES ====================
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/add-product", async (req, res) => {
  try {
    const newProduct = new Product({
      id: Date.now(),
      name: req.body.name,
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price,
      category: req.body.category,
      img: req.body.img,
      images: req.body.images || [],
      description: req.body.description || "",
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      sold: req.body.sold || 0,
      type: req.body.type || "simple",
      sizes: req.body.sizes || [],
      createdAt: new Date(),
    });
    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/edit-product/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await Product.findOne({ id });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    Object.assign(product, req.body);
    product.images = req.body.images || product.images || [];
    product.type = req.body.type || product.type || "simple";
    product.sizes = req.body.sizes || product.sizes || [];
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/delete-product/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await Product.deleteOne({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== CATEGORIES ====================
app.get("/categories", async (req, res) => {
  try {
    let categories = await Category.find();
    if (categories.length === 0) {
      const defaultCats = ["Home", "Cloth", "Gadget", "Book"];
      await Category.insertMany(defaultCats.map((name) => ({ name })));
      categories = await Category.find();
    }
    res.json(categories.map((c) => c.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update-categories", async (req, res) => {
  try {
    const catNames = req.body;
    if (!Array.isArray(catNames))
      return res.status(400).json({ success: false });

    await Category.deleteMany({});
    await Category.insertMany(catNames.map((name) => ({ name })));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ORDERS ====================
app.put("/cancel-order/:orderId", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.orderId, { status: "Cancelled" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/place-order", async (req, res) => {
  try {
    const newOrder = new Order({
      id: "ORD-" + Date.now(),
      date: new Date(),
      status: "Pending",
      userEmail: req.body.userEmail,
      userName: req.body.userName,
      userPhone: req.body.userPhone,
      userAddress: req.body.userAddress,
      items: req.body.items,
      subtotal: req.body.subtotal,
      deliveryFee: req.body.deliveryFee,
      deliveryZone: req.body.deliveryZone,
      total: req.body.total,
      paymentMethod: req.body.paymentMethod,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    await newOrder.save();

    const user = await User.findOne({ email: req.body.userEmail });
    if (user) {
      user.orderCount = (user.orderCount || 0) + 1;
      await user.save();
    }
    res.json({ success: true, order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/user/orders/:email", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/admin/update-order/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ success: false });
    order.status = req.body.status;
    await order.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/admin/order/:id", async (req, res) => {
  try {
    await Order.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== STATS ====================
app.get("/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );
    res.json({ totalUsers, totalProducts, totalOrders, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS (for Admin) ====================
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const orders = await Order.find();
    const usersWithOrderCount = users.map((u) => {
      const userOrders = orders.filter((o) => o.userEmail === u.email).length;
      return { ...u.toObject(), orderCount: u.orderCount || userOrders };
    });
    res.json(usersWithOrderCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ success: false });
    Object.assign(user, req.body);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/users/:email", async (req, res) => {
  try {
    await User.deleteOne({ email: req.params.email });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SETTINGS (with full schema) ====================
const getSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    const defaultSettings = new Setting({});
    await defaultSettings.save();
    return defaultSettings;
  }
  return settings;
};

app.get("/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update-settings", async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PROFILE UPDATE ====================
app.post("/update-profile", async (req, res) => {
  try {
    let {
      currentEmail,
      currentPassword,
      newEmail,
      newPassword,
      profilePicture,
      defaultAddress,
      defaultPhone,
      name,
    } = req.body;
    currentEmail = currentEmail?.toLowerCase().trim();
    const user = await User.findOne({ email: currentEmail });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const wantsToChangeEmail =
      newEmail && newEmail.toLowerCase().trim() !== currentEmail;
    const wantsToChangePassword = newPassword && newPassword.length > 0;

    if (wantsToChangeEmail || wantsToChangePassword) {
      if (!currentPassword || user.password !== currentPassword) {
        return res.status(401).json({
          success: false,
          message: "বর্তমান পাসওয়ার্ড ভুল বা দেয়া হয়নি।",
        });
      }
    }

    if (wantsToChangeEmail) {
      const newEmailLower = newEmail.toLowerCase().trim();
      const existingUser = await User.findOne({ email: newEmailLower });
      if (existingUser)
        return res.status(400).json({
          success: false,
          message: "এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে।",
        });
      user.email = newEmailLower;
    }

    if (wantsToChangePassword) user.password = newPassword;

    if (name !== undefined) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (defaultAddress !== undefined) user.defaultAddress = defaultAddress;
    if (defaultPhone !== undefined) user.defaultPhone = defaultPhone;

    await user.save();

    const { password, ...updatedUser } = user.toObject();
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== PHONE LOGIN ====================
app.post("/phone-login", async (req, res) => {
  try {
    let { phone, name } = req.body;
    phone = phone.trim();
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let user = await User.findOne({ email: phone });
    if (!user) {
      const newUser = new User({
        name: name || "Phone User",
        email: phone,
        password: "",
        role: "user",
        loginCount: 1,
        lastLogin: new Date(),
        lastIp: ip,
        orderCount: 0,
        profilePicture: "",
        defaultAddress: "",
        defaultPhone: phone,
      });
      await newUser.save();
      user = newUser;
    } else {
      user.loginCount += 1;
      user.lastLogin = new Date();
      user.lastIp = ip;
      await user.save();
    }
    const { password, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== LOCATIONS ====================
app.post("/update-location", async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.latitude = latitude;
    user.longitude = longitude;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== BROWSER INFORMATION ====================
app.post("/update-browser-info", async (req, res) => {
  try {
    const { email, browserInfo } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.browserInfo = browserInfo;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== NOTIFICATION PERMISSION ====================
app.post("/update-notification-permission", async (req, res) => {
  try {
    const { email, permission } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.notificationPermission = permission;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GOOGLE LOGIN ====================
app.post("/google-login", async (req, res) => {
  try {
    let { email, name } = req.body;
    email = email.toLowerCase().trim();
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let user = await User.findOne({ email });
    if (!user) {
      const role = email === "sabbirmolla801@gmail.com" ? "admin" : "user";
      const newUser = new User({
        name,
        email,
        password: "",
        role,
        loginCount: 1,
        lastLogin: new Date(),
        lastIp: ip,
        orderCount: 0,
        profilePicture: "",
        defaultAddress: "",
        defaultPhone: "",
      });
      await newUser.save();
      user = newUser;
    } else {
      user.loginCount += 1;
      user.lastLogin = new Date();
      user.lastIp = ip;
      await user.save();
    }
    const { password, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== UPLOAD to ImgBB ====================
app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  try {
    const base64Image = req.file.buffer.toString("base64");
    const body = new URLSearchParams();
    body.append("key", process.env.IMGBB_API_KEY.trim());
    body.append("image", base64Image);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: body,
    });

    const result = await response.json();

    if (result.success) {
      return res.json({ success: true, imageUrl: result.data.url });
    } else {
      console.error("ImgBB upload failed:", result);
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }
  } catch (error) {
    console.error("🔥 Upload error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during upload" });
  }
});

// ==================== LAYOUT SECTIONS (Builder) ====================
app.get("/layout-sections", async (req, res) => {
  try {
    let sections = await LayoutSection.find().sort("order");
    if (sections.length === 0) {
      const defaultSections = [
        {
          id: "featured",
          type: "featured",
          title: "Featured Products",
          enabled: true,
          order: 0,
          bg: "#ffffff",
          padding: "40px 0",
        },
        {
          id: "newArrivals",
          type: "newArrivals",
          title: "New Arrivals",
          enabled: true,
          order: 1,
          bg: "#f8f9fa",
          padding: "40px 0",
        },
        {
          id: "bestSellers",
          type: "bestSellers",
          title: "Best Sellers",
          enabled: true,
          order: 2,
          bg: "#ffffff",
          padding: "40px 0",
        },
        {
          id: "whyChoose",
          type: "whyChoose",
          title: "Why Choose AI Store?",
          enabled: true,
          order: 3,
          bg: "#f8f9fa",
          padding: "60px 0",
        },
        {
          id: "categories",
          type: "categories",
          title: "Shop by Category",
          enabled: true,
          order: 4,
          bg: "#ffffff",
          padding: "40px 0",
        },
      ];
      await LayoutSection.insertMany(defaultSections);
      sections = defaultSections;
    }
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/layout-sections", async (req, res) => {
  try {
    const sections = req.body;
    await LayoutSection.deleteMany({});
    const toInsert = sections.map((s, idx) => ({ ...s, order: idx }));
    await LayoutSection.insertMany(toInsert);
    res.json({ success: true, message: "Layout saved" });
  } catch (err) {
    console.error("Error saving layout:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PAGE LAYOUT (Page Builder) ====================
app.get("/page-layout", async (req, res) => {
  try {
    const doc = await PageLayout.findOne();
    res.json(doc ? doc.layout : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/page-layout", async (req, res) => {
  try {
    const layout = req.body;
    let doc = await PageLayout.findOne();
    if (!doc) {
      doc = new PageLayout({ layout });
    } else {
      doc.layout = layout;
    }
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
