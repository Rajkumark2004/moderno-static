if (typeof window.getRatingStarsHtml === 'undefined') {
    window.getRatingStarsHtml = function(rating) {
        const r = Math.max(0, Math.min(5, parseFloat(rating) || 0));
        const fullStars = Math.floor(r);
        const remainder = r - fullStars;
        const hasHalf = remainder >= 0.25 && remainder < 0.75;
        const extraFull = remainder >= 0.75 ? 1 : 0;
        const finalFull = fullStars + extraFull;
        
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= finalFull) {
                html += '<i class="fa-solid fa-star"></i>';
            } else if (i === finalFull + 1 && hasHalf) {
                html += '<i class="fa-solid fa-star-half-stroke"></i>';
            } else {
                html += '<i class="fa-regular fa-star"></i>';
            }
        }
        return html;
    };
}

if (typeof CATEGORIES === 'undefined') {
    window.CATEGORIES = [
        {
            id: "deals",
            name: "One time Deal",
            icon: "https://lookinggoodfurnituremedia.s3.ap-south-1.amazonaws.com/wp-content/uploads/square-categories/sale.png",
            badge: "Hot",
            itemCount: 48,
            slug: "deals"
        },
        {
            id: "sofas",
            name: "Sofa Sets",
            icon: "https://lookinggoodfurnituremedia.s3.ap-south-1.amazonaws.com/wp-content/uploads/square-categories/Sofas.webp",
            itemCount: 120,
            slug: "sofas"
        },
        {
            id: "beds",
            name: "Beds",
            icon: "https://lookinggoodfurnituremedia.s3.ap-south-1.amazonaws.com/wp-content/uploads/square-categories/Beds.jpg",
            itemCount: 94,
            slug: "bedroom"
        },
        {
            id: "dining",
            name: "Dining Sets",
            icon: "https://lookinggoodfurnituremedia.s3.ap-south-1.amazonaws.com/wp-content/uploads/square-categories/Dining.jpg",
            itemCount: 62,
            slug: "dining"
        },
        {
            id: "material-timber",
            name: "Material & Timber",
            icon: "images/logo.jpeg",
            itemCount: 20,
            slug: "material-timber"
        }
    ];
}

const HERO_SLIDES = [

    {
        id: 2,
        image: "images/banners/banner_sofa_collection.png",
        href: "shop?category=sofas",
        alt: "Luxury Sofa Collection & Custom Loungers"
    },
    // {
    //     id: 3,
    //     image: "images/banners/banner_dining_collection.png",
    //     href: "shop?category=dining",
    //     alt: "Solid Sheesham Dining Sets"
    // },
    {
        id: 4,
        image: "images/banners/banner_bed_collection.png",
        href: "shop?category=bedroom",
        alt: "Royal Bedroom Suites & Hydraulic Storage Beds"
    }
];

const HERO_SIDE_BANNERS = [
    {
        id: "side-1",
        image: "images/banners/banner_exchange_offer.png",
        href: "shop?category=sofas",
        alt: "Custom Furniture Exchange Program"
    },
    {
        id: "side-2",
        image: "images/banners/banner_emi_offer.png",
        href: "shop",
        alt: "Easy 0% No-Cost EMI on All Bank Cards"
    }
];

// PRODUCTS dynamically loaded by PHP
// REVIEWS is dynamically injected from the database in footer.php
if (typeof REVIEWS === 'undefined') {
    window.REVIEWS = [
        {
            id: 1,
            author: "Utkarsh Kumar",
            city: "Bangalore",
            rating: 5,
            date: "Verified Buyer",
            verified: true,
            text: "I ordered L shape sofa from here, it was good experience there and the quality also looks good, Rekha had helped me through out all the process till the delivery.",
            product: "Albatross 3+2 Luxury Fabric Sofa Set",
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        },
        {
            id: 2,
            author: "Monisha Krishnamoorthy",
            city: "Bangalore",
            rating: 5,
            date: "Verified Buyer",
            verified: true,
            text: "We got our living room furnitures from this store and it's the best. Mr. Murali is the one we dealt with. He is very professional, polite, helpful and suggests the apt ones. Customers can blindly walk in to the store and definitely they ll be satisfied.",
            product: "Royale Solid Sheesham 6-Seater Dining Set",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
        },
        {
            id: 3,
            author: "Kavuri Sri Lakshmi Chitra",
            city: "Bangalore",
            rating: 5,
            date: "Verified Buyer",
            verified: true,
            text: "We have casually visited showroom when it was newly opened to find dining table options but found so many varities for it and we ended up purchasing it. Staff is really friendly and patient while discussing with Mr. Natarajan helped us in the selection.",
            product: "Nordic Modern Wall-Mounted TV Unit",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        },
        {
            id: 4,
            author: "Abdul Rahim",
            city: "Bangalore",
            rating: 5,
            date: "Verified Buyer",
            verified: true,
            text: "This is a one stop shop for all furniture. I liked the BTM layout branch, the way they handled my query and understanding my need. I would like to appreciate Mr Sharief who helped me to pick the right sofa and bed coat as per my budget.",
            product: "Celeste King Hydraulic Storage Bed",
            image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
        }
    ];
}

const FAQS = [
    {
        q: "What types of wood do you use for your furniture?",
        a: "We primarily craft our furniture using 100% Solid Seasoned Sheesham Wood (Indian Rosewood), Kiln-Dried Teak Wood, Pinewood, and High-Grade Engineered Wood with natural veneers. All timber undergoes vacuum pressure chemical treatment against borer and termites."
    },
    {
        q: "Is delivery and installation free?",
        a: "Yes! We offer 100% FREE doorstep delivery and professional carpenter installation across Bangalore and Hyderabad on all orders above ₹4,999. Our trained delivery staff will assemble and place the furniture in your preferred room."
    },
    {
        q: "Can I customize the fabric, color, or dimensions of a sofa?",
        a: "Absolutely. At MODERNO, you can choose from over 150+ upholstery fabrics (Velvet, Chenille, Suede, Linen weave, and Italian Leatherette) as well as customize sofa seat depths and orientations. Visit any of our 9+ Experience Centers to speak with our design consultants."
    },
    {
        q: "What warranty do you provide on furniture?",
        a: "We provide up to 10 Years Warranty on Solid Wood against manufacturing defects and termites, 5 Years Warranty on Sofa Frames & Foam elasticity, and 10 Years Warranty on Orthopedic Mattresses."
    },
    {
        q: "Do you offer No-Cost EMI options?",
        a: "Yes, we support 0% Interest No-Cost EMI through major credit cards, Bajaj Finserv, ZestMoney, and HDFC debit cards with flexible tenures from 3 to 12 months."
    },
    {
        q: "How can I visit an Experience Center to see the products before buying?",
        a: "You can walk into any of our 9 showrooms located across Basaveshwar Nagar, BTM Layout, Whitefield, Banashankari, Electronic City, Koramangala, Banaswadi in Bangalore, and Jubilee Hills in Hyderabad. Open all 7 days from 10:30 AM to 9:00 PM."
    }
];
