import React from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { FaMapMarkerAlt } from 'react-icons/fa';

const socialLinks = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/school/indian-institute-of-petroleum-energy/posts/?feedView=all',
    icon: <FaLinkedinIn className="w-6 h-5" />,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/IIPEVsp',
    icon: <FaFacebookF className="w-6 h-5" />,
  },
  {
    name: 'X',
    title: 'X (formerly Twitter)',
    href: 'https://x.com/IIPE_vizag',
    icon: <FaXTwitter className="w-6 h-5" />,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/iipe_visakhapatnam/?hl=en',
    icon: <FaInstagram className="w-6 h-5" />,
  },
];

const IIPE_MAP_URL = 'https://maps.app.goo.gl/PpvkGSFUBgtNTTWU8';

const instituteInfo = {
  name: 'Indian Institute of Petroleum & Energy',
  abbr: 'IIPE',
  address: [
    '2nd Floor, Main Building, AU College of Engineering Campus,',
    'Andhra University, Visakhapatnam, Andhra Pradesh - 530003, India',
  ],
  website: 'https://iipe.ac.in',
};

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row md:justify-between gap-8 items-center md:items-start">
        <div className="flex flex-col gap-2 items-center md:items-start">
          {/* Logo - replace with an <img> if available */}
          <div className="flex items-center mb-2 gap-2">
            <img src="/iipe-logo.png" alt="IIPE Logo" className="h-10 w-10 object-contain rounded bg-white dark:bg-slate-800 p-1 shadow" onError={e => e.target.style.display = 'none'} />
            <span className="font-extrabold text-lg md:text-xl tracking-tight">{instituteInfo.abbr} <span className="font-normal text-xs">LMS</span></span>
          </div>
          <div className="text-sm font-semibold">{instituteInfo.name}</div>
          {instituteInfo.address.map(line => (
            <div key={line} className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{line}</div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 mb-2">
            {/* Prominent Google Maps location icon */}
            <a
              href={IIPE_MAP_URL}
              title="Location: IIPE on Google Maps"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="IIPE Location on Google Maps"
              className="rounded-full p-2 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors text-blue-600 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={{ minWidth: '2.5rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FaMapMarkerAlt className="w-5 h-5" />
            </a>
            {socialLinks.map(link => (
              <a
                key={link.name}
                href={link.href}
                title={link.title || link.name}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors text-blue-600 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-700"
                aria-label={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-xs text-slate-500 dark:text-slate-400">&copy; {year} IIPE. All rights reserved.</div>
            <a
              href={instituteInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-blue-700 dark:text-blue-300 hover:underline text-sm font-medium"
            >
              Visit IIPE Homepage
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
