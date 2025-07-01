  <div className="relative rounded-xl overflow-hidden shadow-glow interactive-card">
        {/* Custom Tree SVG Background */}
        <div className="relative w-full h-48 md:h-96 bg-sand-gradient rounded-xl overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEEB" />
                <stop offset="100%" stopColor="#F5F5DC" />
              </linearGradient>
              <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#228B22" />
                <stop offset="100%" stopColor="#006400" />
              </linearGradient>
            </defs>
            
            {/* Sky background */}
            <rect width="1200" height="400" fill="url(#skyGrad)" />
            
            {/* Ground */}
            <path d="M0,320 Q600,280 1200,320 L1200,400 L0,400 Z" fill="#8B6F47" />
            
            {/* Tree trunk */}
            <rect x="580" y="200" width="40" height="120" fill="#8B4513" />
            
            {/* Tree foliage */}
            <circle cx="600" cy="180" r="80" fill="url(#treeGrad)" opacity="0.9" />
            <circle cx="560" cy="160" r="60" fill="url(#treeGrad)" opacity="0.8" />
            <circle cx="640" cy="160" r="60" fill="url(#treeGrad)" opacity="0.8" />
            
            {/* Detecting spots */}
            <circle cx="300" cy="330" r="8" fill="#FFD700" opacity="0.7" />
            <circle cx="900" cy="340" r="6" fill="#FFD700" opacity="0.7" />
            <circle cx="450" cy="335" r="5" fill="#FFD700" opacity="0.7" />
          </svg>
          
          {/* Overlay content */}
          <div className="absolute inset-0 bg-gradient-to-r from-earth-brown/30 to-forest-green/30">
            <div className="absolute bottom-2 md:bottom-4 left-4 md:left-8 lg:left-16 right-4 md:right-8">
              <h2 className="font-display text-xl md:text-3xl lg:text-5xl text-sand-beige mb-2 md:mb-4 glass-effect py-1 md:py-2 px-2 md:px-4 rounded-lg font-bold drop-shadow-lg">
                History Unearthed
              </h2>
              <p className="text-sand-beige text-sm md:text-lg lg:text-xl font-medium mb-1 glass-effect py-1 md:py-2 px-2 md:px-3 rounded drop-shadow-lg">
                Join our community of metal detecting enthusiasts improving wellbeing one find at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
