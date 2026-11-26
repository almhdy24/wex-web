import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Mail, Clock, HelpCircle, ShieldCheck } from 'lucide-react';
import { ar } from '../../content/ar';
import { normalizeShopInfo, buildWhatsAppLink, buildTelLink } from '../../utils/shopSettings';
import styles from './StoreFooter.module.css';

export default function StoreFooter({ shopInfo = null }) {
  const currentYear = new Date().getFullYear();
  const info = normalizeShopInfo(shopInfo);

  const shopAddress = info.address || ar.desktop.locationShort;
  const workingHours = info.workingHours || ar.desktop.shopHoursShort;
  const shopPhone = info.phone || '';
  const telUrl = buildTelLink(info.phone);
  const whatsappUrl = buildWhatsAppLink(info.whatsapp);
  const footerText = info.footer_text || ar.desktop.footer.aboutShop;
  const shopMapLink = info.shop_map_link || 'https://maps.google.com/?q=Al-Waha+Mall+Omdurman';
  const shopName = info.name || ar.common.appName;

  return (
    <footer className={styles.footer} role="contentinfo" aria-label="تذييل الصفحة">
      <div className={styles.ribbonDivider} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Column 1: The Shop */}
          <div className={styles.column}>
            <div className={styles.brandTitleBox}>
              <h3 className={styles.brandTitle}>{shopName}</h3>
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
              {whatsappUrl && (
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <MessageCircle size={15} className={styles.linkIcon} />
                  <span>{ar.desktop.whatsapp}</span>
                </a>
              </li>
              )}
              {telUrl && (
              <li>
                <a href={telUrl} className={styles.footerLink}>
                  <Phone size={15} className={styles.linkIcon} />
                  <bdi dir="ltr">{shopPhone}</bdi>
                </a>
              </li>
              )}
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
            </div>
            <div className={styles.trustBadge}>
              <ShieldCheck size={18} className={styles.trustIcon} />
              <span>استلام مباشر للجهاز بمقرنا في أم درمان</span>
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
