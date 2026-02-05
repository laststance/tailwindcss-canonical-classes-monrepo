'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
} from '@tabler/icons-react'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-4 rounded-lg border p-4">{children}</div>
    </section>
  )
}

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'nuxt', label: 'Nuxt' },
]

export default function FormsPage() {
  const [sliderValue, setSliderValue] = useState([50])
  const [switchChecked, setSwitchChecked] = useState(false)

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Forms</h1>
        <p className="text-muted-foreground mt-2">
          Form controls and input components.
        </p>
      </div>

      <Section id="button" title="Button">
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <IconBold className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section id="button-group" title="Button Group">
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Center</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </Section>

      <Section id="checkbox" title="Checkbox">
        <div className="flex items-center gap-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="disabled" disabled />
          <Label htmlFor="disabled" className="text-muted-foreground">
            Disabled checkbox
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="checked" defaultChecked />
          <Label htmlFor="checked">Checked by default</Label>
        </div>
      </Section>

      <Section id="combobox" title="Combobox">
        <Combobox>
          <ComboboxTrigger>
            <ComboboxInput placeholder="Select framework..." />
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            {frameworks.map((framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
      </Section>

      <Section id="field" title="Field">
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" placeholder="Enter your email" />
          <FieldDescription>
            We&apos;ll never share your email.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input placeholder="Enter username" aria-invalid />
          <FieldError>Username is already taken.</FieldError>
        </Field>
      </Section>

      <Section id="input" title="Input">
        <Input type="text" placeholder="Text input" />
        <Input type="email" placeholder="Email input" />
        <Input type="password" placeholder="Password input" />
        <Input type="number" placeholder="Number input" />
        <Input disabled placeholder="Disabled input" />
      </Section>

      <Section id="input-group" title="Input Group">
        <InputGroup>
          <InputGroupText>https://</InputGroupText>
          <InputGroupInput placeholder="example.com" />
        </InputGroup>
        <InputGroup>
          <InputGroupText>$</InputGroupText>
          <InputGroupInput type="number" placeholder="0.00" />
          <InputGroupText>USD</InputGroupText>
        </InputGroup>
      </Section>

      <Section id="input-otp" title="Input OTP">
        <InputOTP maxLength={6}>
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
      </Section>

      <Section id="label" title="Label">
        <div className="grid gap-2">
          <Label htmlFor="label-demo">Your name</Label>
          <Input id="label-demo" placeholder="Enter your name" />
        </div>
      </Section>

      <Section id="native-select" title="Native Select">
        <NativeSelect defaultValue="">
          <NativeSelectOption value="">Select a fruit...</NativeSelectOption>
          <NativeSelectOption value="apple">Apple</NativeSelectOption>
          <NativeSelectOption value="banana">Banana</NativeSelectOption>
          <NativeSelectOption value="orange">Orange</NativeSelectOption>
        </NativeSelect>
      </Section>

      <Section id="radio-group" title="Radio Group">
        <RadioGroup defaultValue="option-1">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option-1" id="option-1" />
            <Label htmlFor="option-1">Option 1</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option-2" id="option-2" />
            <Label htmlFor="option-2">Option 2</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option-3" id="option-3" />
            <Label htmlFor="option-3">Option 3</Label>
          </div>
        </RadioGroup>
      </Section>

      <Section id="select" title="Select">
        <Select>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section id="slider" title="Slider">
        <div className="space-y-4">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={1}
            className="w-64"
          />
          <p className="text-muted-foreground text-sm">
            Value: {sliderValue[0]}
          </p>
        </div>
      </Section>

      <Section id="switch" title="Switch">
        <div className="flex items-center gap-2">
          <Switch
            id="airplane-mode"
            checked={switchChecked}
            onCheckedChange={setSwitchChecked}
          />
          <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="disabled-switch" disabled />
          <Label htmlFor="disabled-switch" className="text-muted-foreground">
            Disabled
          </Label>
        </div>
      </Section>

      <Section id="textarea" title="Textarea">
        <Textarea placeholder="Type your message here..." />
        <Textarea placeholder="Disabled textarea" disabled />
      </Section>

      <Section id="toggle" title="Toggle">
        <div className="flex gap-2">
          <Toggle aria-label="Toggle bold">
            <IconBold className="size-4" />
          </Toggle>
          <Toggle aria-label="Toggle italic">
            <IconItalic className="size-4" />
          </Toggle>
          <Toggle aria-label="Toggle underline">
            <IconUnderline className="size-4" />
          </Toggle>
        </div>
        <div className="flex gap-2">
          <Toggle variant="outline" aria-label="Toggle bold">
            <IconBold className="size-4" />
          </Toggle>
          <Toggle disabled aria-label="Toggle disabled">
            Disabled
          </Toggle>
        </div>
      </Section>

      <Section id="toggle-group" title="Toggle Group">
        <ToggleGroup type="single" defaultValue="center">
          <ToggleGroupItem value="left" aria-label="Align left">
            <IconAlignLeft className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <IconAlignCenter className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <IconAlignRight className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" variant="outline">
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            <IconBold className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            <IconItalic className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Toggle underline">
            <IconUnderline className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>
    </div>
  )
}
