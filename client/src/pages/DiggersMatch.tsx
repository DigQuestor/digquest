import { useState } from 'react';
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, MapPin, Shield, Star, Crown, Search, Filter, Clock, Trophy } from 'lucide-react';
import { Link } from 'wouter';

export default function DiggersMatch() {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  const features = [
    {
      icon: <Heart className="h-5 w-5 text-red-500" />,
      title: "Find Your Detecting Partner",
      description: "Connect with fellow metal detecting enthusiasts who share your passion for treasure hunting"
    },
    {
      icon: <MapPin className="h-5 w-5 text-blue-500" />,
      title: "Location-Based Matching",
      description: "Find matches in your area or discover new detecting locations together"
    },
    {
      icon: <Users className="h-5 w-5 text-green-500" />,
      title: "Detecting Groups",
      description: "Join or create detecting groups for friendship, romance, or detecting partnerships"
    },
    {
      icon: <Shield className="h-5 w-5 text-purple-500" />,
      title: "Verified Profiles",
      description: "All members are verified detectorists with authentic profiles and detecting experience"
    }
  ];

  const pricingPlans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$14.99',
      period: 'per month',
      description: 'Perfect for trying out the service',
      features: [
        'Unlimited matches',
        'Direct messaging',
        'Location-based search',
        'Basic profile features',
        'Mobile app access'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual',
      price: '$99.99',
      period: 'per year',
      description: 'Best value - Save 44%',
      popular: true,
      features: [
        'Everything in Monthly',
        'Priority profile placement',
        'Advanced search filters',
        'Detecting event invitations',
        'Premium badges',
        '24/7 priority support'
      ]
    }
  ];

  const testimonials = [
    {
      name: "Sarah & Mike",
      location: "Cornwall, UK",
      story: "Met on Digger's Match and found our first Roman coin together on our third date! Now we're engaged and detecting partners for life.",
      finds: "Over 200 finds together"
    },
    {
      name: "James & Emma",
      location: "Yorkshire, UK",
      story: "Started as detecting buddies through the app, now we run a successful YouTube channel about our adventures together.",
      finds: "Medieval buckle collection"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Digger's Match | Dating for Metal Detecting Enthusiasts</title>
        <meta name="description" content="The premier dating platform exclusively for metal detecting enthusiasts. Find love, friendship, and the perfect detecting partner." />
        <link rel="canonical" href="https://digquest.org/diggers-match" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-sand-beige to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sand-beige to-white text-black">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Heart className="h-8 w-8 text-red-500" />
              <h1 className="text-5xl font-bold text-forest-green">Digger's Match</h1>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xl mb-4 text-earth-brown">
              Where Metal Detecting Hearts Unite
            </p>
            <p className="text-lg mb-6 text-gray-700 max-w-2xl mx-auto">
              The premier dating platform exclusively for metal detecting enthusiasts. 
              Find love, friendship, and the perfect detecting partner.
            </p>
            <div className="flex flex-col items-center gap-4 mb-8">
              <Badge className="bg-red-500 text-white text-xl px-6 py-3 animate-pulse">
                <Crown className="h-5 w-5 mr-2" />
                COMING SOON
              </Badge>
              <p className="text-gray-600 text-sm">
                Currently in development - Premium members will get early access
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Visual */}
        <div className="mb-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-r from-red-100 to-pink-100 h-64 flex items-center justify-center">
              <div className="flex items-center gap-4 text-6xl">
                <Heart className="h-16 w-16 text-red-500 animate-pulse" />
                <Heart className="h-20 w-20 text-red-600" />
                <Heart className="h-16 w-16 text-red-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-forest-green mb-12">
            Find Your Perfect Detecting Match
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-forest-green mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-forest-green mb-8">
            Success Stories
          </h2>
          
          {/* Success visualization */}
          <div className="text-center mb-12">
            <div className="max-w-lg mx-auto">
              <div className="relative overflow-hidden rounded-lg shadow-md bg-gradient-to-br from-orange-200 via-yellow-200 to-pink-200 h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className="h-8 w-8 text-forest-green" />
                    <Heart className="h-6 w-6 text-red-500" />
                    <Trophy className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-lg font-semibold text-forest-green">"Found Love & Treasure Together"</p>
                  <p className="text-sm text-gray-600 mt-2">Join thousands of successful detecting couples</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-sand-beige/30 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-forest-green">{testimonial.name}</h3>
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{testimonial.location}</span>
                  </div>
                  <p className="text-gray-700 mb-3 italic">"{testimonial.story}"</p>
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    {testimonial.finds}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-forest-green mb-4">
            Membership Plans - Coming Soon
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Preview our upcoming pricing structure
          </p>
          <div className="text-center mb-8">
            <Badge className="bg-orange-500 text-white px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              Service Not Yet Available
            </Badge>
          </div>
          
          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-earth-brown shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-earth-brown text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-forest-green">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-earth-brown">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-600">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <div className="w-1.5 h-1.5 bg-earth-brown rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-earth-brown hover:bg-earth-brown/90' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-forest-green mb-4">
            How Digger's Match Will Work
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Preview of the upcoming matchmaking process
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-earth-brown rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-forest-green mb-2">Create Your Profile</h3>
              <p className="text-gray-600">Showcase your detecting experience, favorite locations, and best finds</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-earth-brown rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-forest-green mb-2">Browse & Match</h3>
              <p className="text-gray-600">Use our advanced filters to find compatible detectorists in your area</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-earth-brown rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-forest-green mb-2">Start Detecting Together</h3>
              <p className="text-gray-600">Plan your first detecting date and discover treasures together</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-forest-green/10 to-earth-brown/10 border-earth-brown/20">
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-forest-green mb-4">
              Ready to Find Your Detecting Soulmate?
            </h2>
            <div className="mb-6">
              <Badge className="bg-red-500 text-white text-lg px-4 py-2 animate-pulse">
                <Clock className="h-4 w-4 mr-2" />
                COMING SOON - NOT YET LAUNCHED
              </Badge>
            </div>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Digger's Match is currently under development. Join the waiting list to be notified when we launch. 
              Early supporters get exclusive discounts and priority access.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" disabled className="bg-gray-400 cursor-not-allowed">
                <Clock className="h-5 w-5 mr-2" />
                Join Waiting List (Coming Soon)
              </Button>
              <Link href="/">
                <Button variant="outline" size="lg">
                  Back to DigQuest
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}