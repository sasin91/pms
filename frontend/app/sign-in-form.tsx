"use client"

import { useForm } from "@tanstack/react-form"
import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fetcher } from "@/lib/fetcher"

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean(),
})

type LoginResponse = {
  token: string
  user: {
    email: string
    role: "admin" | "user"
  }
}

type ErrorResponse = {
  message?: string | string[]
}

export function SignInForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string>()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validators: {
      onBlur: signInSchema,
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(undefined)

      try {
        const response = await fetcher("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: value.email,
            password: value.password,
          }),
        })
        const body = (await response.json().catch(() => ({}))) as
          | LoginResponse
          | ErrorResponse

        if (!response.ok) {
          const message =
            "message" in body && body.message
              ? Array.isArray(body.message)
                ? body.message.join(" ")
                : body.message
              : "Sign in failed. Check your email and password."

          setSubmitError(message)
          return
        }

        const session = JSON.stringify(body)
        const persistentStorage = value.rememberMe
          ? localStorage
          : sessionStorage
        const staleStorage = value.rememberMe
          ? sessionStorage
          : localStorage

        persistentStorage.setItem("pms.auth", session)
        staleStorage.removeItem("pms.auth")
        localStorage.removeItem("pms_token")

        router.replace("/patients")
      } catch {
        setSubmitError(
          "The server could not be reached. Check that the backend is running and try again.",
        )
      }
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      noValidate
    >
      <FieldGroup>
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="clinician@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  className="h-11 rounded-xl bg-background px-3"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <div className="flex items-center justify-between gap-4">
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  className="h-11 rounded-xl bg-background px-3"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="rememberMe">
          {(field) => (
            <Field orientation="horizontal" className="gap-2">
              <Checkbox
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(checked === true)
                }
              />
              <FieldLabel
                htmlFor={field.name}
                className="font-normal text-muted-foreground"
              >
                Keep me signed in on this device
              </FieldLabel>
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="lg"
            className="mt-8 h-11 w-full rounded-xl"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        )}
      </form.Subscribe>

      {submitError && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 text-center text-sm text-destructive"
        >
          {submitError}
        </p>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Need access?{" "}
        <a
          href="#"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Contact your administrator
        </a>
      </p>
    </form>
  )
}
