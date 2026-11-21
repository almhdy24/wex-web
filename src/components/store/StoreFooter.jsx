import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Mail, Clock, HelpCircle, ShieldCheck } from 'lucide-react';
import { ar } from '../../content/ar';
import styles from './StoreFooter.module.css';

export default function StoreFooter({ shopInfo = null }) {
  const currentYear = new Date().getFullYear();

  const shopAddress = shopInfo?.shop_address || ar.desktop.locationShort;
  const workingHours = shopInfo?.working_hours || ar.desktop.shopHoursShort;
  const shopPhone = shopInfo?.shop_phone || ar.desktop.phone;
  const shopWhatsapp = shopInfo?.shop_whatsapp || '249912345678';
  const cleanWhatsapp = shopWhatsapp.replace(/\+/g, '').replace(/\s+/g, '');
  const footerText = shopInfo?.footer_text || ar.desktop.footer.aboutShop;
  const shopMapLink = shopInfo?.shop_map_link || 'https://maps.google.com/?q=Al-Waha+Mall+Omdurman';

  return (
    <footer className={styles.footer} role="contentinfo" aria-label="تذييل الصفحة">
      <div className={styles.ribbonDivider} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Column 1: The Shop */}
          <div className={styles.column}>
            <div className={styles.brandTitleBox}>
              <h3 className={styles.brandTitle}>{shopInfo?.shop_name || ar.common.appName}</h3>
              <span className={styles.brandSubtitle}>{ar.common.appSubtitle}</span>
            </div>
            <p className={styles.shopDescription}>{footerText}</p>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <MapPin size={16} className={styles.infoIcon} />
                <span>{shopAddress}</span>
              </div>
              <div className={styles.infoItem}>
                <Clock size={16} className={styles.infoIcon} />
                <span>{workingHours}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className={styles.column}>
            <h4 className={styles.columnHeading}>{ar.desktop.footer.quickLinks}</h4>
            <ul className={styles.linksList}>
              <li>
                <Link to="/" className={styles.footerLink}>{ar.navigation.home}</Link>
              </li>
              <li>
                <Link to="/products" className={styles.footerLink}>{ar.navigation.catalog}</Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className={styles.footerLink}>{ar.navigation.accessories}</Link>
              </li>
              <li>
                <Link to="/orders" className={styles.footerLink}>{ar.navigation.orders}</Link>
              </li>
              <li>
                <Link to="/faq" className={styles.footerLink}>
                  <HelpCircle size={14} className={styles.linkIcon} />
                  <span>{ar.desktop.footer.faq}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div className={styles.column}>
            <h4 className={styles.columnHeading}>{ar.desktop.footer.contactUs}</h4>
            <ul className={styles.linksList}>
              <li>
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <MessageCircle size={15} className={styles.linkIcon} />
                  <span>{ar.desktop.whatsapp}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${shopPhone}`} className={styles.footerLink}>
                  <Phone size={15} className={styles.linkIcon} />
                  <span>{shopPhone}</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@wextech.sd" className={styles.footerLink}>
                  <Mail size={15} className={styles.linkIcon} />
                  <span>support@wextech.sd</span>
                </a>
              </li>
              <li>
                <a
                  href={shopMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <MapPin size={15} className={styles.linkIcon} />
                  <span>موقع المحل على الخريطة</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: How to Order */}
          <div className={styles.column}>
            <h4 className={styles.columnHeading}>{ar.desktop.footer.howToOrder}</h4>
            <div className={styles.stepsList}>
              <div className={styles.stepItem}>{ar.desktop.footer.step1}</div>
              <div className={styles.stepItem}>{ar.desktop.footer.step2}</div>
              <div className={styles.stepItem}>{ar.desktop.footer.step3}</div>
              <div className={styles.stepItem}>{ar.desktop.footer.step4}</div>
            </div>
            <div className={styles.trustBadge}>
              <ShieldCheck size={18} className={styles.trustIcon} />
              <span>استلام ومعاينة للجهاز بمقرنا في أم درمان</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            {ar.desktop.footer.copyright.replace('{year}', currentYear)}
          </div>
          <div className={styles.disclaimer}>
            جميع الأسعار معروضة بعملة ج.س وتُثبَّت عند تأكيد الطلب.
          </div>
        </div>
      </div>
    </footer>
  );
}
