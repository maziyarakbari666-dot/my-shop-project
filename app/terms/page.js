'use client';

export default function TermsPage() {
  return (
    <div className="terms-root">
      <h2 className="terms-title">قوانین و شرایط استفاده از فروشگاه</h2>
      <div className="terms-content">
        <ul>
          <li>
            <b>خرید و پرداخت:</b> خرید محصولات فقط از طریق سایت و با پرداخت آنلاین یا اعتباری BNPL امکان‌پذیر است.
          </li>
          <li>
            <b>ارسال سفارش:</b> سفارش‌های ثبت‌شده در روزهای کاری پردازش و ارسال می‌شوند. زمان تقریبی ارسال ۱ تا ۳ روز کاری است.
          </li>
          <li>
            <b>برگشت کالا:</b> در صورت وجود ایراد یا مغایرت، تا ۲۴ ساعت پس از دریافت می‌توانید مرجوعی ثبت کنید.
          </li>
          <li>
            <b>حفظ حریم خصوصی:</b> اطلاعات شخصی شما فقط برای پردازش سفارش و ارتباط با شما استفاده می‌شود و محرمانه خواهد ماند.
          </li>
          <li>
            <b>خرید اعتباری (BNPL):</b> در صورت انتخاب خرید اعتباری، کاربر متعهد به پرداخت اقساط در زمان مشخص است.
          </li>
          <li>
            <b>پشتیبانی:</b> در صورت بروز مشکل یا سوال، می‌توانید از طریق تماس یا فرم سایت با پشتیبانی ارتباط برقرار کنید.
          </li>
        </ul>
      </div>
      <style>{`
        .terms-root {
          max-width: 650px;
          margin: 42px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 32px 18px;
          font-family: Vazirmatn,sans-serif;
        }
        .terms-title {
          font-size: 1.25rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 19px;
          text-align: center;
        }
        .terms-content {
          font-size: 1.07rem;
          color: #444;
          line-height: 2.1;
        }
        .terms-content ul {
          padding-right: 18px;
        }
        .terms-content li {
          margin-bottom: 15px;
        }
        @media (max-width: 600px) {
          .terms-root { padding: 12px 2px; }
          .terms-title { font-size: 1.05rem; }
        }
      `}</style>
    </div>
  );
}