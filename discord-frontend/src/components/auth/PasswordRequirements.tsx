import { getPasswordChecks } from "@/lib/authValidation";

type PasswordRequirementsProps = {
  password: string;
};

const RULES: { key: keyof ReturnType<typeof getPasswordChecks>; label: string }[] = [
  { key: "minLength", label: "En az 8 karakter" },
  { key: "hasUpper", label: "En az bir büyük harf" },
  { key: "hasLower", label: "En az bir küçük harf" },
  { key: "hasSpecial", label: "En az bir özel karakter (!@#$%...)" },
];

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  const checks = getPasswordChecks(password);
  const remaining = RULES.filter((rule) => !checks[rule.key]);

  if (remaining.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-700 font-hanken">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        Şifre kuralları sağlandı
      </p>
    );
  }

  return (
    <ul className="space-y-1.5 pt-1">
      {remaining.map((rule) => (
        <li
          key={rule.key}
          className="flex items-center gap-1.5 text-xs text-stone-500 font-hanken"
        >
          <span className="material-symbols-outlined text-sm text-primary-container">
            radio_button_unchecked
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
