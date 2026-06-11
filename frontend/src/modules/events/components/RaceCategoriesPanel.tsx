import { Flag } from "lucide-react";
import { useAsyncData } from "../../core/hooks/useAsyncData";
import { api } from "../../core/lib/api";

export function RaceCategoriesPanel() {
  const { data, loading, error } = useAsyncData(() => api.raceCategories(), []);

  return (
    <section className="panel">
      <div className="section-title">
        <Flag size={18} />
        <div>
          <p className="eyebrow">Read-only reference</p>
          <h2>Race categories</h2>
        </div>
      </div>
      {loading && <p className="muted">Loading categories...</p>}
      {error && <p className="message danger">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Surface</th>
              <th>Distance</th>
              <th>Horse age</th>
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((category) => (
              <tr key={category.categoryId}>
                <td>{category.categoryId}</td>
                <td>{category.categoryName}</td>
                <td>{category.trackSurface || "-"}</td>
                <td>{category.distanceText || category.distanceMeter || "-"}</td>
                <td>{category.minHorseAge ?? "-"}</td>
                <td>{category.allowedGender || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
