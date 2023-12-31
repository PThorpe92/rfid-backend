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
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        onChange={(event) => props.onSelectDate(event.currentTarget.value)}
      />
    </div>
  );
}

export default DatePicker;
