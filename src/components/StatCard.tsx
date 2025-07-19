import { colors, Paper, Typography } from "@mui/material";
import { FC, useContext, useMemo } from "react";

interface StatCardProps {
    trend: number, 
    score: number,
    selected: boolean
}

const StatCard : FC<StatCardProps> = ({trend, score, selected}) => {
    let trendDisplay = ''
    let scoreDisplay = ''

    if (isNaN(trend)) {
        trendDisplay = ''
    } else if (trend >= 0) {
        trendDisplay = '+' + trend.toFixed(2) + '%'
    } else {
        trendDisplay = trend.toFixed(2) + '%'
    }

    if (isNaN(score)) {
        scoreDisplay = ''
    } else {
        scoreDisplay = (score * 10).toFixed(1)
    }



    return <Paper square={false} sx={{ padding: 2, width: 135, backgroundColor: selected ? colors.blue[300] : colors.grey.A100}} elevation={3}>
        <Typography color={trend == 0 ? colors.grey[900] : trend > 0 ? colors.green[600] : colors.red[700]} >{trendDisplay}</Typography>
        <Typography fontSize={24} fontWeight={'bold'}>{scoreDisplay}</Typography>
    </Paper>
}

interface FinalCardProps {
    score: number,
    selected: boolean
}

export const FinalCard : FC<FinalCardProps> = ({score, selected}) => {
    let scoreDisplay = ''
    if (isNaN(score)) {
        scoreDisplay = '-'
    } else {
        scoreDisplay = (score * 10).toFixed(1)
    }

    return <Paper square={false} sx={{ padding: 2, width: 95, backgroundColor: selected ? colors.blue[300] : colors.grey.A100}} elevation={3}>
        <Typography fontSize={32} fontWeight={'bold'}>{scoreDisplay}</Typography>
    </Paper>
}

export default StatCard