import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFound() {
  const { t } = useTranslation("common");
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-ink">{t("common:notFound")}</p>
      <Link to="/" className="text-sm text-gray-500 hover:text-ink">
        {t("common:goBack")}
      </Link>
    </div>
  );
}
