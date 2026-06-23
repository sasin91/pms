import Image from "next/image"
import { HeartPulse } from "lucide-react"

import { SignInForm } from "@/app/sign-in-form"

export default function Home() {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <HeartPulse aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-semibold tracking-tight">Patient Management</p>
              <p className="text-sm text-muted-foreground">Clinical workspace</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in to securely access patients, appointments, and clinical
              records.
            </p>
          </div>

          <SignInForm />
        </div>
      </section>

      <section className="relative hidden min-h-svh overflow-hidden bg-[#e8f4f2] lg:block">
        <Image
          src="/clinic-illustration.svg"
          alt="Illustration of a bright, modern clinic reception area"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/55 to-transparent px-12 pb-12 pt-32 text-white">
          <p className="max-w-lg text-2xl font-medium leading-snug text-balance">
            Everything your care team needs, in one calm and connected place.
          </p>
          <p className="mt-3 text-sm text-white/75">
            Secure patient coordination for modern clinics.
          </p>
        </div>
      </section>
    </main>
  )
}
