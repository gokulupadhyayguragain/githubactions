'use client';

import { useEffect, useRef } from 'react';

interface GoogleUser {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  sub: string;
}

export function GoogleLogin({ onLogin }: { onLogin: (user: GoogleUser) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Google Identity Services script
    if (!scriptLoaded.current && !document.querySelector('#google-identity-script')) {
      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      scriptLoaded.current = true;
    }

    const loadGIS = async () => {
      if (!window.google || !containerRef.current) return;

      try {
        await window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '932167395499-d60lnr2s9vdq4csvvj4fdkiatir52rvo',
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          containerRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: 300,
            text: 'signin_with',
          }
        );

        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Error loading GIS:', error);
      }
    };

    const handleCredentialResponse = (response: any) => {
      if (response.credential) {
        // Decode the JWT token
        const responsePayload = decodeJwt(response.credential);
        onLogin(responsePayload);
      }
    };

    const decodeJwt = (token: string): GoogleUser => {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    };

    // Wait for script to load
    const checkScript = setInterval(() => {
      if (window.google) {
        loadGIS();
        clearInterval(checkScript);
      }
    }, 100);

    return () => clearInterval(checkScript);
  }, [onLogin]);

  return <div ref={containerRef} className="flex justify-center mt-6" />;
}