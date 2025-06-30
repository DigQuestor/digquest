import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number[]
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value)
      if (onValueChange) {
        onValueChange([newValue])
      }
    }

    return (
      <input
        ref={ref}
        type="range"
        value={value ? value[0] : props.defaultValue || 0}
        onChange={handleChange}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "slider",
          className
        )}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
