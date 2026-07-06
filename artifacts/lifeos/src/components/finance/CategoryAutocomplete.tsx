import { Input } from "@/components/ui/input";

interface CategoryAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  placeholder?: string;
  required?: boolean;
}

export function CategoryAutocomplete({
  id,
  value,
  onChange,
  categories,
  placeholder,
  required,
}: CategoryAutocompleteProps) {
  const listId = `${id}-categories`;
  return (
    <>
      <Input
        id={id}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      <datalist id={listId}>
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </>
  );
}
