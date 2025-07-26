"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material"
import '../../../../styles/dabin/MemberRecommendationSearchForm.css';

const MemberRecommendationSearchForm = ({ onSearch, userRoles, onParamsChange }) => {
  const [formData, setFormData] = useState({
    suggestionUserId: "",
    suggestionUserName: "",
    suggestionUserRole: "",
    suggestionStoreName: "",
    joinDateStart: "",
    joinDateEnd: "",
    userName: "",
    recommendationUserRole: "",
  })

  useEffect(() => {
    onParamsChange(formData)
  }, [formData, onParamsChange])

  const handleChange = (field) => (event) => {
    const newFormData = {
      ...formData,
      [field]: event.target.value,
    }
    setFormData(newFormData)
  }

  return (
    <Paper
      elevation={0}
      className="member-recommendation-searchform-paper"
    >
      <Grid container direction="column" spacing={1}>
        {/* 1줄: 가입일, 추천인/피추천인 역할 */}
        <Grid item>
          <div className="member-recommendation-searchform-row">
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">가입 시작일</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <TextField
                    type="date"
                    name="joinDateStart"
                    value={formData.joinDateStart}
                    onChange={handleChange("joinDateStart")}
                    size="small"
                    margin="dense"
                    InputProps={{ className: "member-recommendation-searchform-input" }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">가입 종료일</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <TextField
                    type="date"
                    name="joinDateEnd"
                    value={formData.joinDateEnd}
                    onChange={handleChange("joinDateEnd")}
                    size="small"
                    margin="dense"
                    InputProps={{ className: "member-recommendation-searchform-input" }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">추천인 아이디</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="추천인 아이디"
                    value={formData.suggestionUserId}
                    onChange={handleChange("suggestionUserId")}
                    size="small"
                    margin="dense"
                    InputProps={{ className: "member-recommendation-searchform-input" }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">추천인 이름</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="추천인 이름"
                    value={formData.suggestionUserName}
                    onChange={handleChange("suggestionUserName")}
                    size="small"
                    margin="dense"
                    InputProps={{ className: "member-recommendation-searchform-input" }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">추천인 등급</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>추천인 등급</InputLabel>
                    <Select
                      value={formData.suggestionUserRole}
                      label="추천인 등급"
                      onChange={handleChange("suggestionUserRole")}
                    >
                      <MenuItem value="">등급을 선택하세요.</MenuItem>
                      {userRoles.map((role) => (
                        <MenuItem key={role.userRoleIndex} value={role.userRoleIndex}>
                          {role.userRoleKorNm}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">가맹점 이름</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="가맹점 이름"
                    value={formData.suggestionStoreName}
                    onChange={handleChange("suggestionStoreName")}
                    size="small"
                    margin="dense"
                    InputProps={{ className: "member-recommendation-searchform-input" }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">가입자 이름</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="가입자 이름"
                    value={formData.userName}
                    onChange={handleChange("userName")}
                    size="small"
                    margin="dense"
                    InputProps={{ className: "member-recommendation-searchform-input" }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ flex: 1, minWidth: 0 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item><Typography variant="body2" className="member-recommendation-searchform-label">가입자 등급</Typography></Grid>
                <Grid item sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>가입자 등급</InputLabel>
                    <Select
                      value={formData.recommendationUserRole}
                      label="가입자 등급"
                      onChange={handleChange("recommendationUserRole")}
                    >
                      <MenuItem value="">등급을 선택하세요.</MenuItem>
                      {userRoles.map((role) => (
                        <MenuItem key={role.userRoleIndex} value={role.userRoleIndex}>
                          {role.userRoleKorNm}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default MemberRecommendationSearchForm 