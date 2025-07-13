import { useEffect, useState } from "react";
import { getCommissionSetting, setCommissionSetting } from "../../../api/auth";
import "../../../styles/jiyun/commissionSetting/commission-setting.css";

export default function CommissionSetting() {
  const [setting, setSetting] = useState([]);
  const [originalSetting, setOriginalSetting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommissionSetting = async () => {
      try {
        const response = await getCommissionSetting();
        const data = response.data.map((item) => ({
          ...item,
          businessGradeRate: item.businessGradeRate * 10,
        }));
        setSetting(data);
        setOriginalSetting(data);
      } catch (err) {
        setError("수수료 설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchCommissionSetting();
  }, []);

  const handleChange = (idx, field, value) => {
    setSetting((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = setting.map((item) => ({
      ...item,
      businessGradeRate: Number(item.businessGradeRate) / 10,
    }));
    try {
      await setCommissionSetting(payload);
      alert("저장 성공!");
      setOriginalSetting(setting);
    } catch (e) {
      alert("저장 실패");
    }
  };

  const getRateByIndex = (index) => {
    const item = setting.find((s) => s.businessGradeIndex === index);
    return item ? item.businessGradeRate : "";
  };

  const companyRate = Number(getRateByIndex(1)) || 0;
  const gradeSum = setting
    .filter((s) => s.businessGradeIndex >= 2 && s.businessGradeIndex <= 11)
    .reduce((acc, cur) => acc + Number(cur.businessGradeRate), 0);
  const departmentValue = 100 - companyRate;
  const isSumValid = departmentValue === gradeSum;
  const isChanged = JSON.stringify(originalSetting) !== JSON.stringify(setting);

  if (loading) return <div>로딩중...</div>;

  return (
    <form className="commission-form" onSubmit={handleSave}>
      <div className="header">
        <h1>중개 수수료율 설정</h1>
        <button
          className="save-button"
          type="submit"
          disabled={!isSumValid || !isChanged}
        >
          저장
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="commission-container">
        <div className="total-ratio">
          <h2>전체 비율 설정</h2>
          <div className="ratio-row">
            <label>회사</label>
            <input
              className="commission-input"
              type="number"
              value={companyRate}
              onChange={(e) => {
                const realIdx = setting.findIndex(
                  (s) => s.businessGradeIndex === 1
                );
                handleChange(realIdx, "businessGradeRate", e.target.value);
              }}
            />
            <span>%</span>
          </div>
          <div className="ratio-row">
            <label>사업부</label>
            <input
              className="commission-input"
              value={departmentValue}
              readOnly
            />
            <span>%</span>
          </div>
          <div className="ratio-total">= 100 %</div>
        </div>

        <div className="grade-ratio">
          <h2>직급별 설정 (사업부)</h2>
          <div className="grade-list">
            {setting
              .filter(
                (s) => s.businessGradeIndex >= 2 && s.businessGradeIndex <= 11
              )
              .map((grade, idx) => {
                const realIdx = setting.findIndex(
                  (s) => s.businessGradeIndex === grade.businessGradeIndex
                );
                return (
                  <div className="grade-row" key={grade.businessGradeIndex}>
                    <label>{`${idx + 1}. ${grade.businessGradeName}`}</label>
                    <input
                      className="commission-input"
                      type="number"
                      value={grade.businessGradeRate}
                      onChange={(e) =>
                        handleChange(
                          realIdx,
                          "businessGradeRate",
                          e.target.value
                        )
                      }
                    />
                    <span>%</span>
                  </div>
                );
              })}
          </div>
          <div className={`grade-sum ${isSumValid ? "" : "invalid"}`}>
            총: {gradeSum}%
          </div>
        </div>
      </div>
    </form>
  );
}
