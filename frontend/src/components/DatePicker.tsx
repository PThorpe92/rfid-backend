import { JSXElement } from 'solid-js';

interface DatePickerProps {
  label: string;
  onSelectDate: (date: string) => void;
}

function DatePicker(props: DatePickerProps): JSXElement {
  return (
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700">{props.label}</label>
      <input
        type="date"
        class="input input-bordered input-info w-full max-w-xs"
        onChange={(event) => props.onSelectDate(event.currentTarget.value)}
      />
    </div>
  );
}

export default DatePicker;
