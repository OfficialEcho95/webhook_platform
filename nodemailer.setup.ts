import nodemailer from "nodemailer";

class EtherealMailSetup {
  private transporter: nodemailer.Transporter | null = null;
  private fallback: boolean = false;

  private async getOrCreateTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    try {
      // 🔹 Try to create a live Ethereal account + SMTP connection
      const testAccount = await nodemailer.createTestAccount();
      console.log("🆕 Ethereal test account created:", testAccount.user);

      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        service: 'gmail',
        port: 587,
        secure: false, 
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
      });

      // 🔹 Verify the connection once — avoids silent timeouts later
      await this.transporter.verify();
      console.log("✅ Connected to Ethereal SMTP server");
    } catch (err) {
      console.warn(
        "⚠️ Ethereal SMTP unavailable — using JSON transport fallback:",
        (err as Error).message,
      );
      // ✅ Fallback that doesn’t open any network connection
      this.fallback = true;
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }

    return this.transporter;
  }

  public proxy = new Proxy(
    {},
    {
      get: (_, prop) => {
        return async (...args: any[]) => {
          const real = await this.getOrCreateTransporter();
          const fn = (real as any)[prop];
          if (typeof fn === "function") {
            return fn.apply(real, args);
          }
          return fn;
        };
      },
    },
  );

  public isFallback() {
    return this.fallback;
  }
}

export const transporter = new EtherealMailSetup().proxy as nodemailer.Transporter;
