import React from 'react';
import { FileCheck, ShieldAlert, Scale } from 'lucide-react';
export const Terms = () => {
    return (<div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b] flex items-center gap-3">
          <FileCheck className="text-primary"/>
          Terms & Conditions
        </h2>
        <p className="text-sm text-text-light">Review our formal policies and legal guidelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8 space-y-8">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[10px]">
                <ShieldAlert size={14}/>
                01. Acceptance of Terms
              </div>
              <p className="text-sm text-text-color leading-relaxed">
                By accessing and using this School Management System, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use this software.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[10px]">
                <Scale size={14}/>
                02. User Accounts
              </div>
              <p className="text-sm text-text-color leading-relaxed">
                Users are responsible for maintaining the confidentiality of their account information, including passwords. Any activity occurring under your account is your sole responsibility. We reserve the right to terminate accounts that violate our safety policies.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[10px]">
                <FileCheck size={14}/>
                03. Data Privacy
              </div>
              <p className="text-sm text-text-color leading-relaxed">
                We value the privacy of student and teacher data. All information entered into the system is encrypted and stored securely. We do not sell or share your data with third-party advertisers.
              </p>
              <div className="bg-light-gray/50 rounded-lg p-4 space-y-2">
                <p className="text-xs text-text-light flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Student records are strictly confidential.
                </p>
                <p className="text-xs text-text-light flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Financial data is processed through secure gateways.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[10px]">
                <ShieldAlert size={14}/>
                04. Subscription & Billing
              </div>
              <p className="text-sm text-text-color leading-relaxed">
                Subscription plans are billed in advance on a monthly or yearly basis. All fees are non-refundable. Failure to pay subscription fees may result in temporary suspension of access to certain premium features.
              </p>
            </section>

            <div className="pt-6 border-t border-border">
              <p className="text-[10px] text-text-light text-center italic">
                © 2026 School Manager Inc. Last updated: July 2026
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-4">
            <h3 className="font-bold text-text-color text-sm">Related Documents</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-light-gray transition-all border border-transparent hover:border-border">
                <h4 className="font-bold text-primary text-xs">Privacy Policy</h4>
                <p className="text-[11px] text-text-light">Data handling and protection</p>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-light-gray transition-all border border-transparent hover:border-border">
                <h4 className="font-bold text-secondary text-xs">Refund Policy</h4>
                <p className="text-[11px] text-text-light">Billing and cancellations</p>
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>);
};
