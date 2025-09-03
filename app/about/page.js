'use client';

export default function AboutPage() {
  return (
    <div className="about-root">
      <h2 className="about-title">درباره فروشگاه تازه‌فود</h2>
      <div className="about-content">
        <p>
          فروشگاه تازه‌فود با هدف ارائه تازه‌ترین مواد غذایی، نان، سبزیجات و شیرینی‌های باکیفیت تأسیس شده است.
          ما تلاش می‌کنیم محصولات متنوع و سالم را با قیمت مناسب و ارسال سریع به دست شما برسانیم.
        </p>
        <p>
          سابقه ما در عرضه محصولات خانگی و ارگانیک، تضمین کیفیت و رضایت مشتریان را به همراه دارد.
          تیم پشتیبانی ما همیشه آماده پاسخ‌گویی به سوالات و مشکلات شماست.
        </p>
        <p>
          <b>ماموریت ما:</b> تامین سریع، مطمئن و اقتصادی مواد غذایی برای خانواده‌های ایرانی با امکان خرید اعتباری BNPL.
        </p>
        <div className="about-contact">
          <b>راه‌های ارتباط با ما:</b>
          <ul>
            <li>تلفن: 021-12345678</li>
            <li>ایمیل: info@tazehfood.ir</li>
            <li>اینستاگرام: <a href="https://instagram.com/example" target="_blank" rel="noopener noreferrer">@example</a></li>
          </ul>
        </div>
      </div>
      <style>{`
        .about-root {
          max-width: 700px;
          margin: 40px auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 18px #eee;
          padding: 32px 20px;
          font-family: Vazirmatn,sans-serif;
        }
        .about-title {
          font-size: 1.35rem;
          color: #27ae60;
          font-weight: bold;
          margin-bottom: 21px;
          text-align: center;
        }
        .about-content {
          font-size: 1.07rem;
          color: #444;
          line-height: 2.2;
        }
        .about-contact {
          margin-top: 19px;
          font-size: 1rem;
        }
        .about-contact ul {
          padding-right: 18px;
          margin-top: 9px;
        }
        .about-contact a {
          color: #e67e22;
          font-weight: bold;
          text-decoration: none;
        }
        .about-contact a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .about-root { padding: 12px 2px; }
          .about-title { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}