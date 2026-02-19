import React from "react";
import { Star, Users, TrendingUp, Award } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  image: string;
  quote: string;
  rating: number;
  farmType: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Kwame Mensah",
    role: "Farmer",
    location: "Ashanti Region, Ghana",
    image: "👨‍🌾",
    quote:
      "FarmKonnect has transformed how I manage my farm. I can now track my crops and livestock in real-time, and the weather insights have helped me save money on irrigation.",
    rating: 5,
    farmType: "Mixed Farm",
  },
  {
    id: "2",
    name: "Ama Osei",
    role: "Agricultural Agent",
    location: "Central Region, Ghana",
    image: "👩‍🌾",
    quote:
      "As an agricultural extension agent, FarmKonnect helps me support multiple farmers more efficiently. The MERL dashboard gives me insights I never had before.",
    rating: 5,
    farmType: "Extension Services",
  },
  {
    id: "3",
    name: "Ibrahim Koroma",
    role: "Livestock Farmer",
    location: "Northern Region, Ghana",
    image: "👨‍🚜",
    quote:
      "Managing my cattle herd was chaotic until I started using FarmKonnect. The health records and breeding tracking features are game-changers.",
    rating: 5,
    farmType: "Livestock Farm",
  },
  {
    id: "4",
    name: "Fatima Diallo",
    role: "Marketplace Seller",
    location: "Dakar, Senegal",
    image: "👩‍💼",
    quote:
      "The marketplace feature has opened new revenue streams for my farm. I can now sell directly to other farmers and buyers across the region.",
    rating: 5,
    farmType: "Crop Farm",
  },
];

const stats = [
  {
    icon: <Users className="h-8 w-8 text-green-600" />,
    value: "5,000+",
    label: "Active Farmers",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-green-600" />,
    value: "40%",
    label: "Avg. Yield Increase",
  },
  {
    icon: <Award className="h-8 w-8 text-green-600" />,
    value: "4.9/5",
    label: "Average Rating",
  },
  {
    icon: <Users className="h-8 w-8 text-green-600" />,
    value: "15+",
    label: "Countries",
  },
];

export function SocialProof() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-16">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Trusted by Farmers Across Africa
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-12">
            What Farmers Say
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-4">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-3xl">{testimonial.image}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {testimonial.location}
                    </div>
                  </div>
                </div>

                {/* Farm Type Badge */}
                <div className="mt-3">
                  <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
                    {testimonial.farmType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
            Trusted by leading agricultural organizations
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">ISO 27001</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Certified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">GDPR</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
