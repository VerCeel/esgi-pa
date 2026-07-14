import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface OtpFieldProps {
  id?: string
  value: string
  onChange: (value: string) => void
  /** Appelé dès que les 6 chiffres sont saisis — permet de valider sans cliquer. */
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

/** Les 6 cases du code TOTP, en deux groupes de trois. */
export function OtpField({
  id,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
}: OtpFieldProps) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
